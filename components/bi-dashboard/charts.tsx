"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Package, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

// Colores para gráficos
const COLORS = {
  primary: '#8B4513', // madera-natural
  secondary: '#A0522D', // terracota  
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

interface KPIData {
  label: string;
  value: number | string;
  change: number;
  icon: string; // Cambiado de any a string
  color: 'success' | 'warning' | 'danger' | 'info';
  format?: 'currency' | 'percentage' | 'time' | 'number';
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface TendenciaData {
  name: string;
  total: number;
  completadas: number;
  pendientes: number;
}

// Componente KPI Card con métricas de BI
export function BIKPICard({ data }: { data: KPIData }) {
  const { label, value, change, icon, color, format = 'number' } = data;
  
  // Mapeo de strings a componentes de iconos
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Package":
        return Package;
      case "CheckCircle":
        return CheckCircle;
      case "Clock":
        return Clock;
      case "Users":
        return Users;
      case "TrendingUp":
        return TrendingUp;
      case "TrendingDown":
        return TrendingDown;
      case "AlertTriangle":
        return AlertTriangle;
      case "Activity":
        return Activity;
      default:
        return Package; // Default fallback
    }
  };
  
  const Icon = getIconComponent(icon);
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'time':
        const hours = Math.floor(val / 3600);
        const minutes = Math.floor((val % 3600) / 60);
        return `${hours}h ${minutes}m`;
      default:
        return val.toLocaleString('es-ES');
    }
  };

  const colorClasses = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const iconColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${colorClasses[color]}`}>
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
          {formatValue(value)}
        </p>
        <p className="text-sm text-gray-600 tracking-wide">{label}</p>
      </div>
    </div>
  );
}

// Gráfico de barras para tiempos por estado
export function TiemposPorEstadoChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">
        Tiempo Promedio por Estado
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Tiempo Promedio']}
          />
          <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de línea para tendencia de órdenes
export function TendenciaOrdenesChart({ data }: { data: TendenciaData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">
        Tendencia de Órdenes (Últimos 30 días)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: 'Órdenes', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="completadas" 
            stroke={COLORS.success} 
            strokeWidth={2}
            dot={{ fill: COLORS.success, r: 4 }}
            name="Completadas"
          />
          <Line 
            type="monotone" 
            dataKey="pendientes" 
            stroke={COLORS.warning} 
            strokeWidth={2}
            dot={{ fill: COLORS.warning, r: 4 }}
            name="Pendientes"
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            dot={{ fill: COLORS.primary, r: 4 }}
            name="Total"
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de pie para distribución por proyecto
export function DistribucionProyectosChart({ data }: { data: ChartData[] }) {
  const pieColors = [COLORS.primary, COLORS.secondary, COLORS.info, COLORS.warning, COLORS.success, COLORS.purple];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">
        Distribución por Proyecto
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [value, 'Órdenes']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de área para rendimiento de armadores
export function RendimientoArmadoresChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">
        Rendimiento de Armadores Top 5
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: 'Órdenes/Hora', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}`, 'Rendimiento']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={COLORS.info} 
            fill={COLORS.info} 
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Métricas de eficiencia
export function EficienciaMetricas({ data }: { data: { onTime: number; delayed: number; efficiency: number } }) {
  const { onTime, delayed, efficiency } = data;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">
        Métricas de Eficiencia
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Entregas a Tiempo</span>
            <span className="text-sm font-bold text-green-600">{onTime}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${onTime}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Entregas Retrasadas</span>
            <span className="text-sm font-bold text-red-600">{delayed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${delayed}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Eficiencia General</span>
            <span className="text-sm font-bold text-blue-600">{efficiency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Proyecciones y predicciones
export function ProyeccionesCard({ data }: { data: { 
  nextMonth: number;
  growthRate: number;
  capacityUtilization: number;
  recommendedActions: string[];
} }) {
  const { nextMonth, growthRate, capacityUtilization, recommendedActions } = data;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Proyecciones y Recomendaciones
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{nextMonth}</p>
            <p className="text-sm text-blue-600">Órdenes próximas mes</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{growthRate}%</p>
            <p className="text-sm text-green-600">Tasa de crecimiento</p>
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              Capacidad Utilizada: {capacityUtilization}%
            </span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${capacityUtilization}%` }}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Acciones Recomendadas:
          </h4>
          <ul className="space-y-1">
            {recommendedActions.map((action, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
