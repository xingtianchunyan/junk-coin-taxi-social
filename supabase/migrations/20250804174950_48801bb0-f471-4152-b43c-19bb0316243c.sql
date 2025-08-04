-- 添加需求类型字段到ride_requests表
ALTER TABLE ride_requests 
ADD COLUMN request_type TEXT DEFAULT 'community_carpool',
ADD COLUMN processing_driver_id UUID REFERENCES users(id);

-- 为新字段添加检查约束
ALTER TABLE ride_requests 
ADD CONSTRAINT check_request_type 
CHECK (request_type IN ('community_carpool', 'quick_carpool_info'));

-- 添加索引以提高查询性能
CREATE INDEX idx_ride_requests_request_type ON ride_requests(request_type);
CREATE INDEX idx_ride_requests_processing_driver ON ride_requests(processing_driver_id);

-- 更新现有记录的需求类型为默认值
UPDATE ride_requests SET request_type = 'community_carpool' WHERE request_type IS NULL;