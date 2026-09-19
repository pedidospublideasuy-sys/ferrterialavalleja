<?php
require_once('wp-load.php');
global $wpdb;

echo "Consultando productos...\n";
$query = "
    SELECT p.ID, p.post_title, p.post_type, p.post_name, p.post_parent
    FROM {$wpdb->posts} p
    WHERE p.post_type IN ('product', 'product_variation')
      AND p.post_status = 'publish'
";
$posts = $wpdb->get_results($query);

echo "Obteniendo metas...\n";
$meta_query = "
    SELECT post_id, meta_key, meta_value
    FROM {$wpdb->postmeta}
    WHERE meta_key IN ('_price', '_sku', '_stock', '_thumbnail_id') OR meta_key LIKE 'attribute_%'
";
$metas = $wpdb->get_results($meta_query);

echo "Mapeando metas...\n";
$meta_map = [];
foreach ($metas as $m) {
    if (!isset($meta_map[$m->post_id])) $meta_map[$m->post_id] = [];
    $meta_map[$m->post_id][$m->meta_key] = $m->meta_value;
}

echo "Filtrando clones...\n";
$clone_ids = [];
foreach ($meta_map as $pid => $m) {
    if (isset($m['_sku']) && stripos($m['_sku'], 'wc-') === 0) {
        $clone_ids[$pid] = true;
    }
}

echo "Obteniendo imagenes...\n";
$attachments = $wpdb->get_results("SELECT ID, guid FROM {$wpdb->posts} WHERE post_type = 'attachment'");
$attach_map = [];
foreach ($attachments as $a) {
    $attach_map[$a->ID] = $a->guid;
}

echo "Obteniendo categorias...\n";
$taxonomies = $wpdb->get_results("
    SELECT tr.object_id, t.name, tt.taxonomy 
    FROM {$wpdb->term_relationships} tr 
    JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id 
    JOIN {$wpdb->terms} t ON tt.term_id = t.term_id 
    WHERE tt.taxonomy IN ('product_cat', 'product_brand')
");
$tax_map = [];
foreach ($taxonomies as $t) {
    if (!isset($tax_map[$t->object_id])) $tax_map[$t->object_id] = ['category' => []];
    if ($t->taxonomy === 'product_cat') $tax_map[$t->object_id]['category'][] = $t->name;
}

$export_products = [];
$export_variations = [];

foreach ($posts as $p) {
    if (isset($clone_ids[$p->ID])) continue;

    $pm = isset($meta_map[$p->ID]) ? $meta_map[$p->ID] : [];
    
    $thumb_id = isset($pm['_thumbnail_id']) ? $pm['_thumbnail_id'] : null;
    $image_url = ($thumb_id && isset($attach_map[$thumb_id])) ? $attach_map[$thumb_id] : null;
    if ($image_url && strpos($image_url, 'http://') === 0) {
        $image_url = str_replace('http://', 'https://', $image_url);
    }

    $sku = isset($pm['_sku']) ? $pm['_sku'] : $p->post_name;
    $price = isset($pm['_price']) ? (float)$pm['_price'] : 0;
    $stock = isset($pm['_stock']) ? (int)$pm['_stock'] : 0;

    if ($p->post_type === 'product') {
        $cat = (isset($tax_map[$p->ID]) && !empty($tax_map[$p->ID]['category'])) ? $tax_map[$p->ID]['category'][0] : 'General';
        
        $export_products[] = [
            'id' => $p->ID,
            'name' => $p->post_title,
            'sku' => $sku,
            'price' => $price,
            'stock' => $stock,
            'category' => $cat,
            'image' => $image_url
        ];
    } else {
        $attrs = [];
        foreach ($pm as $k => $v) {
            if (strpos($k, 'attribute_pa_') === 0) {
                $attrs[str_replace('attribute_pa_', '', $k)] = $v;
            }
        }
        $export_variations[] = [
            'id' => $p->ID,
            'parent_id' => $p->post_parent,
            'name' => $p->post_title,
            'sku' => $sku,
            'price' => $price,
            'stock' => $stock,
            'image' => $image_url,
            'attributes' => $attrs
        ];
    }
}

file_put_contents('/tmp/neon_export_products.json', json_encode($export_products, JSON_UNESCAPED_UNICODE));
file_put_contents('/tmp/neon_export_variations.json', json_encode($export_variations, JSON_UNESCAPED_UNICODE));

echo "Exportados " . count($export_products) . " productos y " . count($export_variations) . " variaciones limpias.\n";
?>
