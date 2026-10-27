SELECT 'northwind.'||t AS bang, (xpath('/row/c/text()', query_to_xml('select count(*) as c from northwind.'||t, false, true, '')))[1]::text AS so_dong
FROM unnest(array['customers','orders','order_details','products','categories','suppliers','employees','shippers']) t;
SELECT md5(string_agg(order_id||':'||product_id||':'||quantity||':'||unit_price, ',' ORDER BY order_id, product_id)) AS md5_order_details FROM northwind.order_details;
SELECT count(*) AS hw_count, sum(total) AS hw_sum, max(id) AS hw_max FROM lab03_indexing.hw_contracts;
SELECT d.datname, array_to_string(s.setconfig, ',') AS db_setting FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase WHERE d.datname = 'advance_be_lab';
SELECT version();
