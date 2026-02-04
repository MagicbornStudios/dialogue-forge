"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjects = useProjects;
exports.useCreateProject = useCreateProject;
const react_query_1 = require("@tanstack/react-query");
const sdk_1 = require("@payloadcms/sdk");
const enums_1 = require("../../payload-collections/enums");
// Create singleton PayloadSDK instance for client-side REST calls
const payload = new sdk_1.PayloadSDK({
    baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api',
});
/**
 * React Query hook to fetch all projects
 */
function useProjects() {
    return (0, react_query_1.useQuery)({
        queryKey: ['projects'],
        queryFn: async () => {
            const result = await payload.find({
                collection: enums_1.PAYLOAD_COLLECTIONS.PROJECTS,
                limit: 200,
            });
            return result.docs;
        },
    });
}
/**
 * React Query mutation hook to create a new project
 */
function useCreateProject() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const created = await payload.create({
                collection: enums_1.PAYLOAD_COLLECTIONS.PROJECTS,
                data,
            });
            return created;
        },
        onSuccess: () => {
            // Invalidate projects query to refetch the list
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}
