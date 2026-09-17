-- =====================================================================
-- Skema database TransJakarta App Review Analytics
--
-- Cara pakai: buka Supabase, menu SQL Editor, tempel SELURUH isi file ini,
-- lalu klik Run. Aman dijalankan berulang kali.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tabel utama
--
-- Nama label ditulis dengan huruf besar di awal (Apresiasi, Keluhan, Saran,
-- Pertanyaan) karena itulah bentuk persis yang dikeluarkan model Anda, sesuai
-- label2id di notebook training. Menuliskannya berbeda di sini akan membuat
-- semua baris ditolak database.
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id          text primary key,              -- ID review dari Google Play, mencegah duplikat
  tanggal     timestamptz not null,
  bintang     smallint    not null check (bintang between 1 and 5),
  teks        text        not null,
  label       text        not null check (label in ('Apresiasi','Keluhan','Saran','Pertanyaan')),
  confidence  numeric(5,4),
  created_at  timestamptz not null default now()
);

-- Index untuk mempercepat filter tanggal, label, dan bintang di dashboard.
create index if not exists reviews_tanggal_idx on public.reviews (tanggal desc);
create index if not exists reviews_label_idx   on public.reviews (label);
create index if not exists reviews_bintang_idx on public.reviews (bintang);


-- ---------------------------------------------------------------------
-- 2. Row Level Security
--    Pengunjung hanya boleh membaca. Menulis hanya bisa lewat service key
--    yang dipegang GitHub Actions, dan service key melewati RLS.
-- ---------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "publik boleh baca" on public.reviews;
create policy "publik boleh baca"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

-- Tidak ada policy untuk insert, update, atau delete.
-- Artinya anon key yang dipakai dashboard tidak bisa mengubah data sama sekali.


-- ---------------------------------------------------------------------
-- 3. Fungsi agregasi
--    Dashboard memanggil fungsi ini lewat supabase.rpc(). Perhitungan
--    dilakukan di database, bukan dengan menarik ribuan baris ke browser.
--
--    Aturan parameter: NULL berarti "tanpa filter".
-- ---------------------------------------------------------------------

create or replace function public.review_kpi(
  p_start   timestamptz default null,
  p_end     timestamptz default null,
  p_labels  text[]      default null,
  p_bintang smallint[]  default null
)
returns table (
  jumlah_review   bigint,
  rata_bintang    numeric,
  persen_keluhan  numeric
)
language sql
stable
as $$
  with terfilter as (
    select * from public.reviews r
    where (p_start   is null or r.tanggal >= p_start)
      and (p_end     is null or r.tanggal <  p_end)
      and (p_labels  is null or r.label   = any(p_labels))
      and (p_bintang is null or r.bintang = any(p_bintang))
  )
  select
    count(*)::bigint,
    round(avg(bintang)::numeric, 2),
    case when count(*) = 0 then 0
         else round(100.0 * count(*) filter (where label = 'Keluhan') / count(*), 1)
    end
  from terfilter;
$$;


create or replace function public.review_mingguan(
  p_start   timestamptz default null,
  p_end     timestamptz default null,
  p_labels  text[]      default null,
  p_bintang smallint[]  default null
)
returns table (
  minggu date,
  label  text,
  jumlah bigint
)
language sql
stable
as $$
  select
    date_trunc('week', r.tanggal)::date as minggu,
    r.label,
    count(*)::bigint
  from public.reviews r
  where (p_start   is null or r.tanggal >= p_start)
    and (p_end     is null or r.tanggal <  p_end)
    and (p_labels  is null or r.label   = any(p_labels))
    and (p_bintang is null or r.bintang = any(p_bintang))
  group by 1, 2
  order by 1, 2;
$$;


create or replace function public.review_per_label(
  p_start   timestamptz default null,
  p_end     timestamptz default null,
  p_labels  text[]      default null,
  p_bintang smallint[]  default null
)
returns table (label text, jumlah bigint)
language sql
stable
as $$
  select r.label, count(*)::bigint
  from public.reviews r
  where (p_start   is null or r.tanggal >= p_start)
    and (p_end     is null or r.tanggal <  p_end)
    and (p_labels  is null or r.label   = any(p_labels))
    and (p_bintang is null or r.bintang = any(p_bintang))
  group by 1
  order by 2 desc;
$$;


create or replace function public.review_per_bintang(
  p_start   timestamptz default null,
  p_end     timestamptz default null,
  p_labels  text[]      default null,
  p_bintang smallint[]  default null
)
returns table (bintang smallint, jumlah bigint)
language sql
stable
as $$
  select r.bintang, count(*)::bigint
  from public.reviews r
  where (p_start   is null or r.tanggal >= p_start)
    and (p_end     is null or r.tanggal <  p_end)
    and (p_labels  is null or r.label   = any(p_labels))
    and (p_bintang is null or r.bintang = any(p_bintang))
  group by 1
  order by 1;
$$;


-- Waktu pembaruan terakhir, untuk indikator "Terakhir diperbarui" di dashboard.
create or replace function public.review_terakhir_update()
returns timestamptz
language sql
stable
as $$
  select max(created_at) from public.reviews;
$$;


-- Izinkan pengunjung memanggil fungsi di atas.
grant execute on function public.review_kpi(timestamptz, timestamptz, text[], smallint[])          to anon, authenticated;
grant execute on function public.review_mingguan(timestamptz, timestamptz, text[], smallint[])     to anon, authenticated;
grant execute on function public.review_per_label(timestamptz, timestamptz, text[], smallint[])    to anon, authenticated;
grant execute on function public.review_per_bintang(timestamptz, timestamptz, text[], smallint[])  to anon, authenticated;
grant execute on function public.review_terakhir_update()                                          to anon, authenticated;
