-- 为vehicles表的user_id字段添加外键约束
ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;