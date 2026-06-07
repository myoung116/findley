-- Replace placeholder rooms with actual Findley Lake rooms
-- Original seed had generic names; this reflects the real house layout.

delete from public.rooms;

insert into public.rooms (name, bed_count, max_occupancy, attributes) values
  ('Master',        1, 2,  '{"floor": 1, "bathroom": "private", "beds": ["king"], "notes": "Papa always gets this room"}'),
  ('Mini Master',   1, 2,  '{"floor": 1, "bathroom": "private", "beds": ["king"]}'),
  ('Twins',         4, 8,  '{"floor": 2, "bathroom": "shared", "beds": ["full","full","twin","twin"], "notes": "Extra capacity with trundle or air mattresses"}'),
  ('Spiral',        3, 6,  '{"floor": 2, "bathroom": "private", "beds": ["king","full","full"]}'),
  ('Americas',      3, 6,  '{"floor": 2, "bathroom": "shared", "beds": ["queen","queen","queen"]}'),
  ('Garage Bunks',  6, 6,  '{"floor": 0, "bathroom": "shared", "beds": ["twin","twin","twin","twin","twin","twin"], "notes": "Overflow bunk beds in garage"}');
