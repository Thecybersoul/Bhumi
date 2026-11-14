-- 024: drop the old Sales CRM deal table. Its two rows were copied into
-- transactions by 022 and by hand afterwards (the Sarjapura 50-acre JD deal).
-- Nothing reads crm_deals any more.
drop table if exists public.crm_deals;
