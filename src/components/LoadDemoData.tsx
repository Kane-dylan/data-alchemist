import React from 'react';
import { Button } from '@/components/ui/button';

interface LoadDemoDataProps {
  onDataLoaded: (data: any[], entityType: 'task') => void;
}

const LoadDemoData: React.FC<LoadDemoDataProps> = ({ onDataLoaded }) => {
  const loadTasksDemo = async () => {
    try {
      const response = await fetch('/tasks_demo.csv');
      const csvText = await response.text();
      
      // Parse CSV manually
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const item: any = {};
        headers.forEach((header, index) => {
          // Remove quotes if present
          const value = values[index]?.replace(/"/g, '');
          
          // Convert numeric fields
          if (header === 'Duration' || header === 'MaxConcurrent') {
            item[header] = parseInt(value) || 0;
          } else {
            item[header] = value;
          }
        });
        return item;
      });
      
      console.log('Loaded demo data:', data);
      onDataLoaded(data, 'task');
      
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  };

  return (
    <Button onClick={loadTasksDemo} className="mb-4">
      Load Demo Tasks Data
    </Button>
  );
};

export default LoadDemoData;
