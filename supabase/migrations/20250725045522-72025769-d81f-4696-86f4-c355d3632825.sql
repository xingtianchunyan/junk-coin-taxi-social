-- 检查并确保vehicles表的driver_user_id字段存在正确的外键约束
-- 如果外键约束不存在，则创建它

-- 删除旧的外键约束（如果存在）
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_user_id_fkey;

-- 添加正确的外键约束
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_driver_user_id_fkey 
FOREIGN KEY (driver_user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;