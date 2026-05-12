import React, { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Hub, Employee } from '@/types';

interface Props {
  hubsData?: Hub[];
  employees?: Employee[];
}

export default function HubsEmployeeChart({ hubsData = [], employees = [] }: Props) {

  const dataset = useMemo(() => {
    return hubsData.map((hub) => {
      const hubEmployees = employees.filter(emp => {
        if (emp.hub == null) return false;
        if (typeof emp.hub === 'number') return emp.hub === hub.id;
        return (emp.hub as Hub).id === hub.id;
      });

      const countByStatus = (status: string) =>
        hubEmployees.filter(e => ((e.status || '') as string).toLowerCase() === status).length;

      return {
        product: hub.name,

        active: countByStatus('active'),
        inactive: countByStatus('inactive'),
        awol: countByStatus('awol'),
        resign: countByStatus('resign'),
        blacklist: countByStatus('blacklist'),
      };
    });
  }, [hubsData, employees]);

  const filteredDataset = dataset.filter(
    d => d.active || d.inactive || d.awol || d.resign || d.blacklist
  );

  if (!filteredDataset.length) {
    return <div style={{ padding: 20 }}>No employee data available</div>;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <BarChart
        dataset={filteredDataset}

        xAxis={[
          {
            dataKey: 'product',
            scaleType: 'band',
            tickLabelStyle: {
              angle: -40,
              textAnchor: 'end',
              fontSize: 11,
            },
          },
        ]}

        series={[
          { dataKey: 'active', label: 'Active', color: '#22C55E' },
          { dataKey: 'inactive', label: 'Inactive', color: '#9CA3AF' },
          { dataKey: 'awol', label: 'AWOL', color: '#F59E0B' },
          { dataKey: 'resign', label: 'Resigned', color: '#3B82F6' },
          { dataKey: 'blacklist', label: 'Blacklist', color: '#EF4444' },
        ]}

        yAxis={[
          {
            label: 'Employee Count',
          },
        ]}

        height={450}
        width={Math.max(300, filteredDataset.length * 100)}

        margin={{ top: 40, left: 60 }}

        slotProps={{
          legend: {
            direction: 'horizontal',
            position: { vertical: 'top', horizontal: 'center' },
          },
        }}
      />
    </div>
  );
}
