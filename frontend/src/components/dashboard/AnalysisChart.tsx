import React from 'react';

const AnalysisChart: React.FC = () => {
  // Dados simulados para o gráfico
  const data = [
    { day: 'Seg', value: 12 },
    { day: 'Ter', value: 8 },
    { day: 'Qua', value: 15 },
    { day: 'Qui', value: 22 },
    { day: 'Sex', value: 18 },
    { day: 'Sab', value: 5 },
    { day: 'Dom', value: 3 }
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Análises realizadas nos últimos 7 dias
      </div>
      
      <div className="flex items-end justify-between h-32 space-x-2">
        {data.map((item, index) => {
          const heightClass = item.value === maxValue ? 'h-full' : 
                             item.value >= maxValue * 0.75 ? 'h-3/4' :
                             item.value >= maxValue * 0.5 ? 'h-1/2' :
                             item.value >= maxValue * 0.25 ? 'h-1/4' : 'h-2';
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 ${heightClass}`}></div>
              <div className="text-xs text-gray-500 mt-2">{item.day}</div>
              <div className="text-xs font-medium text-gray-700">{item.value}</div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <span>Total: {data.reduce((sum, item) => sum + item.value, 0)} análises</span>
        <span>Média: {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1)}/dia</span>
      </div>
    </div>
  );
};

export default AnalysisChart;
