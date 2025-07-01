
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Phone, CheckCircle, Calendar } from 'lucide-react';
import { RideRequest } from '@/types/RideRequest';

interface RideRequestCardProps {
  request: RideRequest;
  onComplete: (id: string) => void;
}

const RideRequestCard: React.FC<RideRequestCardProps> = ({ request, onComplete }) => {
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isUpcoming = (date: Date) => {
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff <= 24 && hoursDiff > 0;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      request.status === 'completed' 
        ? 'opacity-75 bg-gray-50' 
        : isUpcoming(request.requestedTime) 
          ? 'border-orange-200 bg-orange-50' 
          : 'bg-white'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">{request.friendName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isUpcoming(request.requestedTime) && request.status === 'pending' && (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                即将到达
              </Badge>
            )}
            <Badge 
              variant={request.status === 'completed' ? 'secondary' : 'outline'}
              className={request.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
            >
              {request.status === 'completed' ? '已完成' : '待处理'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{request.startLocation} → {request.endLocation}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatDateTime(request.requestedTime)}</span>
        </div>
        
        {request.contactInfo && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{request.contactInfo}</span>
          </div>
        )}
        
        {request.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <strong>备注：</strong>{request.notes}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            创建于 {formatDateTime(request.createdAt)}
          </div>
          
          {request.status === 'pending' && (
            <Button
              onClick={() => onComplete(request.id)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              标记完成
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RideRequestCard;
