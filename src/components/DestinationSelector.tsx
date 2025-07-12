import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface DestinationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (destination: Destination) => void;
  selectedDestination: Destination | null;
}

const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedDestination
}) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadDestinations();
    }
  }, [open]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preset_destinations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('加载目的地失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (destination: Destination) => {
    onSelect(destination);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            选择目的地
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            请选择您要前往的数字游民社区目的地
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {destinations.map((destination) => (
                <Card 
                  key={destination.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDestination?.id === destination.id 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(destination)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{destination.name}</h3>
                          {selectedDestination?.id === destination.id && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {destination.address}
                        </p>
                        {destination.description && (
                          <p className="text-xs text-gray-500">
                            {destination.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DestinationSelector;