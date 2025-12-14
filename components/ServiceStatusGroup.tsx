"use client";

import { ServiceCategory, ServiceStatusInfo } from "@/lib/utils/service-status";
import { useTranslations } from "next-intl";
import { ServiceStatusCard } from "./ServiceStatusCard";

interface ServiceStatusGroupProps {
  category: ServiceCategory;
  services: ServiceStatusInfo[];
  onRefresh?: (serviceId: string) => Promise<void>;
}

export function ServiceStatusGroup({
  category,
  services,
  onRefresh,
}: ServiceStatusGroupProps) {
  const t = useTranslations("serviceStatus");

  if (services.length === 0) {
    return null;
  }

  const getCategoryName = (cat: ServiceCategory): string => {
    return t(`categories.${cat}`);
  };

  return (
    <section className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-950">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {getCategoryName(category)}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceStatusCard
            key={service.id}
            service={service}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </section>
  );
}
