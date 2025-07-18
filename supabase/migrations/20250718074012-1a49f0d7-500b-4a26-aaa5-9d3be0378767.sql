-- 删除users表中的contact字段
ALTER TABLE public.users DROP COLUMN contact;

-- 在preset_destinations表中添加contact字段
ALTER TABLE public.preset_destinations ADD COLUMN contact text;

-- 将approval_status字段从text改为boolean
-- 首先添加新的boolean字段
ALTER TABLE public.preset_destinations ADD COLUMN is_approved boolean DEFAULT false;

-- 将现有数据迁移到新字段（approved状态转为true，其他为false）
UPDATE public.preset_destinations SET is_approved = (approval_status = 'approved');

-- 删除旧的approval_status字段
ALTER TABLE public.preset_destinations DROP COLUMN approval_status;

-- 为新字段添加注释
COMMENT ON COLUMN public.preset_destinations.contact IS '社区管理员联系方式（手机号或微信号）';
COMMENT ON COLUMN public.preset_destinations.is_approved IS '是否已被超级管理员批准';