<?php

class IIP_Map_Save_Fields {
  static function get_screendoor_meta_object( $data, $fields_meta = null ) {
    file_put_contents( ABSPATH. 'meta.txt', print_r($data,1) );
    // Get serialized array of screendoor meta values
    if ( !$fields_meta ) {
      $fields_meta = [
        'screendoor' => [ 'mapping' => [], 'card' => [] ],
        'formidable' => [ 'mapping' => [], 'card' => [] ]
      ];
    }

    if( !empty( $data[ 'projectId' ] ) ) {
      $fields_meta[ 'screendoor' ][ 'project_id' ] = ( sanitize_text_field( $data[ 'projectId' ] ) );
    }
    if( !empty( $data[ 'form' ] ) ) {
      $fields_meta[ 'screendoor' ][ 'form_arr' ] = ( json_decode( stripslashes ( $data[ 'form' ] ) ) );
    }

    if ( array_key_exists( 'mapping', $data ) ) {
      if ( $data['mapping'] ) {
        $mapping = json_decode(stripslashes($data['mapping']));

        // Add map items to map params array
        $fields_meta['screendoor']['mapping']['available_arr'] = $mapping->available;
        $fields_meta['screendoor']['mapping']['date_arr'] = $mapping->date;
        $fields_meta['screendoor']['mapping']['time_arr'] = $mapping->time;
        $fields_meta['screendoor']['mapping']['location_arr'] = $mapping->location;
        $fields_meta['screendoor']['mapping']['name_arr'] = $mapping->name;
        $fields_meta['screendoor']['mapping']['other_arr'] = $mapping->other;
        $fields_meta['screendoor']['mapping']['fields_obj'] = $mapping->fields;
        $fields_meta['screendoor']['mapping']['topic_arr'] = $mapping->topic;
      } else {
        $fields_meta['screendoor']['mapping'] = null;
      }
    }

    if ( array_key_exists( 'card', $data ) ) {
      if ( $data['card'] ) {
        $card = json_decode(stripslashes($data['card']));

        $fields_meta['screendoor']['card']['title'] = $card->titleSection;
        $fields_meta['screendoor']['card']['date'] = $card->dateSection;
        $fields_meta['screendoor']['card']['time'] = $card->timeSection;
        $fields_meta['screendoor']['card']['location'] = $card->locationSection;
        $fields_meta['screendoor']['card']['additional'] = $card->additionalSection;
        $fields_meta['screendoor']['card']['added_arr'] = $card->added;
      } else {
        $fields_meta['screendoor']['card'] = null;
      }
    }
    return $fields_meta;
  }

  function save_screendoor_ajax() {
    check_ajax_referer( 'iip-map-screendoor-nonce', 'security' );

    $id = $_POST[ 'postId' ];

    $original = get_post_meta( $id, '_iip_map_fields_meta', true );
    $fields_meta = IIP_Map_Save_Fields::get_screendoor_meta_object( $_POST, $original );

    // Send updated array of post meta values
    $result = update_post_meta( $id, '_iip_map_fields_meta', $fields_meta );

    global $wpdb;
    if ( !$result && $fields_meta != $original ) {
      wp_send_json( ['success' => false, 'error' => $wpdb->last_error]);
      exit;
    }
    if ( isset($_POST['deleteEvents'] ) ) {
      $wpdb->delete( "{$wpdb->prefix}iip_map_data", ['post_id' => $id] );
    }
    update_post_meta( $id, '_iip_map_fields_updated', 1 );
    $event_counts = $wpdb->get_row( "SELECT COUNT(*) as total, COUNT(location_geo) as geocoded FROM {$wpdb->prefix}iip_map_data WHERE post_id = $id" );
    wp_send_json( [ 'success' => true, 'events' => $event_counts ] );
  }

  function save_screendoor_events_ajax() {
    global $wpdb;
    check_ajax_referer( 'iip-map-screendoor-nonce', 'security' );
//    wp_send_json(['success' => false, 'error' => 'test']);
    $id = $_POST[ 'postId' ];
    $project_id = $_POST['projectId'];
    $events = json_decode( stripslashes( $_POST['events'] ) );

    $values = [];
    foreach ( $events as $event ) {
      $fields = $wpdb->_real_escape( serialize( $event->fields ) );
      $title = $wpdb->_real_escape( $event->title );
      $loc = $wpdb->_real_escape( $event->location );
      $topic = $wpdb->_real_escape( $event->topic );
      $values[] = "($id, $event->ext_id, $project_id, '$title', '$loc','$topic','$fields')";
    }
    $values = implode( ',', $values );
    $query = "INSERT INTO {$wpdb->prefix}iip_map_data (post_id, ext_id, project_id, title, location, topic, fields) VALUES $values ON DUPLICATE KEY UPDATE title=VALUES(title), fields=VALUES(fields), location=VALUES(location)";
    $created = $wpdb->query( $query );
    $updated = count( $events ) - $created;

    $event_counts = $wpdb->get_row( "SELECT COUNT(*) as total, COUNT(location_geo) as geocoded FROM {$wpdb->prefix}iip_map_data WHERE post_id = $id" );
    wp_send_json( [ 'success' => true, 'created' => $created, 'updated' => $updated, 'events' => $event_counts ] );
  }

}