<?php
require_once('wp-load.php');

$args = [
    'post_type' => ['product', 'product_variation'],
    'post_status' => 'publish',
    'posts_per_page' => -1,
];

$posts = get_posts($args);
$export = [];

foreach ($posts as $p) {
    $product_id = $p->ID;
    $sku = get_post_meta($product_id, '_sku', true);
    
    // Omitir clones con wc- en el SKU
    if (stripos($sku, 'wc-') !== false) {
        continue;
    }

    $type = 'simple';
    $terms = wp_get_post_terms($product_id, 'product_type');
    if (!empty($terms)) {
        $type = $terms[0]->slug;
    }
    if ($p->post_type === 'product_variation') {
        $type = 'variation';
    }

    $item = [
        'ID' => $product_id,
        'title' => $p->post_title,
        'type' => $type,
        'sku' => $sku,
        'parent_id' => $p->post_parent,
        'price' => get_post_meta($product_id, '_price', true),
        'stock' => get_post_meta($product_id, '_stock', true),
    ];

    // Images
    $thumb_id = get_post_thumbnail_id($product_id);
    if ($thumb_id) {
        $item['image'] = wp_get_attachment_url($thumb_id);
    } else {
        $item['image'] = null;
    }

    // Categories
    if ($type !== 'variation') {
        $cats = wp_get_post_terms($product_id, 'product_cat');
        $item['categories'] = array_map(function($c) { return $c->name; }, $cats);
    } else {
        // Variation attributes
        $meta = get_post_meta($product_id);
        $attrs = [];
        foreach ($meta as $k => $v) {
            if (strpos($k, 'attribute_') === 0) {
                $attrs[str_replace('attribute_pa_', '', $k)] = $v[0];
            }
        }
        $item['attributes'] = $attrs;
    }

    $export[] = $item;
}

file_put_contents('/tmp/woo_clean_export.json', json_encode($export, JSON_UNESCAPED_UNICODE));
echo "Exported " . count($export) . " items.";
?>
