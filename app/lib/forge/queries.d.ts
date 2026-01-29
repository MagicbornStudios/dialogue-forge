import type { Project } from '@/app/payload-types';
export type ProjectDocument = Project;
/**
 * React Query hook to fetch all projects
 */
export declare function useProjects(): import("@tanstack/react-query").UseQueryResult<Project[], Error>;
/**
 * React Query mutation hook to create a new project
 */
export declare function useCreateProject(): import("@tanstack/react-query").UseMutationResult<Project, Error, {
    name: string;
    description?: string;
}, unknown>;
