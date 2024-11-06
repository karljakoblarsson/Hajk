import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getServices,
  getServiceById,
  getLayersByServiceId,
  getMapsByServiceId,
  createService,
  updateService,
  deleteService,
} from "./requests";
import { Service, ServiceUpdateFormData } from "./types";
import { Layer } from "../layers";
import { Map } from "../maps";

// React Query hook to fetch all services
// This hook uses the `getServices` function from the services `requests` module
export const useServices = (): UseQueryResult<Service[]> => {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(),
  });
};

// React Query hook to fetch a service by id
// This hook uses the `getServiceById` function from the services `requests` module
export const useServiceById = (serviceId: string): UseQueryResult<Service> => {
  return useQuery({
    queryKey: ["services", serviceId],
    queryFn: () => getServiceById(serviceId),
  });
};

// React Query hook to fetch layers by service id
// This hook uses the `getLayersByServiceId` function from the services `requests` module
export const useLayersByServiceId = (
  serviceId: string
): UseQueryResult<Layer[]> => {
  return useQuery({
    queryKey: ["layersByServiceId", serviceId],
    queryFn: () => getLayersByServiceId(serviceId),
  });
};

// React Query hook to fetch maps by service id
// This hook uses the `getMapsByServiceId` function from the  services `requests` module
export const useMapsByServiceId = (
  serviceId: string
): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByServiceId", serviceId],
    queryFn: () => getMapsByServiceId(serviceId),
  });
};

// React mutation hook to create a service
// This hook uses the `createService` function from the services `requests` module
export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation hook to update a service
// This hook uses the `updateService` function from the services `requests` module
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: ServiceUpdateFormData;
    }) => updateService(serviceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation hook to delete a service
// This hook uses the `deleteService` function from the services `requests` module
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => deleteService(serviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
