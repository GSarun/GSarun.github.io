-- 1. เช็คว่าเป็น Admin หรือยัง
SELECT * FROM public.profiles WHERE email = 'g.sarun@hotmail.com';

-- 2. ถ้ายังไม่เป็น Admin ให้รันคำสั่งนี้เพื่อปรับสิทธิ์
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'g.sarun@hotmail.com';

-- 3. เช็คผลลัพธ์อีกครั้ง
SELECT * FROM public.profiles WHERE email = 'g.sarun@hotmail.com';
