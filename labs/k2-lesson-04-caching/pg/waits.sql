SELECT 'mau lock=' || count(*) FILTER (WHERE wait_event_type = 'Lock')
    || ' khac=' || count(*) FILTER (WHERE wait_event_type IS NOT NULL AND wait_event_type <> 'Lock')
    || ' su_kien=' || COALESCE(string_agg(wait_event_type || ':' || wait_event, ',' ORDER BY wait_event), 'none')
FROM pg_stat_activity
WHERE application_name = 'k2l04-pgbench';
