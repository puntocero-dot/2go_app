import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <Button 
          variant={action.variant || "default"} 
          onClick={action.onClick}
          className="min-w-[120px]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Predefined empty states for common use cases
export function EmptyOrders({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      }
      title="No hay órdenes"
      description="No se encontraron órdenes con los filtros seleccionados."
      action={
        onCreate && {
          label: "Crear Orden",
          onClick: onCreate,
          variant: "default"
        }
      }
    />
  );
}

export function EmptyProjects({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
      title="No hay proyectos"
      description="Comienza creando tu primer proyecto para gestionar órdenes."
      action={
        onCreate && {
          label: "Crear Proyecto",
          onClick: onCreate,
          variant: "default"
        }
      }
    />
  );
}

export function EmptyUsers({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      title="No hay usuarios"
      description="No se encontraron usuarios registrados."
      action={
        onCreate && {
          label: "Crear Usuario",
          onClick: onCreate,
          variant: "default"
        }
      }
    />
  );
}

export function EmptyBIDashboard({ onResetFilters }: { onResetFilters: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      title="No hay datos para analizar"
      description="No hay suficientes datos en el período seleccionado para generar el análisis de Business Intelligence. Se recomienda tener al menos 30 días de datos."
      action={{
        label: "Ver Todos los Datos",
        onClick: onResetFilters,
        variant: "default"
      }}
    />
  );
}
