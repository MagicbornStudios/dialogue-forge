import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from '@/video/workspace/video-template-workspace-contracts';

export interface PayloadVideoTemplate {
  id: number;
  project: number;
  title: string;
  template: VideoTemplate;
  updatedAt: string;
  createdAt: string;
}

export class VideoTemplatePayloadAdapter implements VideoTemplateWorkspaceAdapter {
  private baseUrl: string;
  private projectId: number | null;

  constructor(baseUrl: string = '/api', projectId: number | null = null) {
    this.baseUrl = baseUrl;
    this.projectId = projectId;
  }

  setProjectId(projectId: number | null) {
    this.projectId = projectId;
  }

  async loadTemplate(templateId: string): Promise<VideoTemplate | null> {
    const response = await fetch(`${this.baseUrl}/video-templates/${templateId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    const data: PayloadVideoTemplate = await response.json();
    return data.template;
  }

  async listTemplates(): Promise<Array<{ id: string; name: string; updatedAt?: string }>> {
    const params = new URLSearchParams();
    if (this.projectId) {
      params.set('where[project][equals]', this.projectId.toString());
    }
    
    const response = await fetch(`${this.baseUrl}/video-templates?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to list templates: ${response.statusText}`);
    }
    
    const data = await response.json();
    const docs: PayloadVideoTemplate[] = data.docs || [];
    
    return docs.map(doc => ({
      id: doc.id.toString(),
      name: doc.title,
      updatedAt: doc.updatedAt,
    }));
  }

  async createTemplate(
    projectId: number,
    title: string,
    template: VideoTemplate
  ): Promise<PayloadVideoTemplate> {
    const response = await fetch(`${this.baseUrl}/video-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: projectId,
        title,
        template,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }

    return response.json();
  }

  async updateTemplate(
    id: number,
    updates: { title?: string; template?: VideoTemplate }
  ): Promise<PayloadVideoTemplate> {
    const response = await fetch(`${this.baseUrl}/video-templates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update template: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const id = parseInt(templateId, 10);
    if (Number.isNaN(id)) {
      throw new Error(`Invalid template ID: ${templateId}`);
    }
    const response = await fetch(`${this.baseUrl}/video-templates/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }
  }

  async saveTemplate(template: VideoTemplate): Promise<VideoTemplate> {
    if (!this.projectId) {
      throw new Error('No project selected. Cannot save template.');
    }

    // Check if template has an ID (numeric from Payload)
    const templateId = template.id ? parseInt(template.id, 10) : null;

    let savedTemplate: PayloadVideoTemplate;
    
    if (templateId && !isNaN(templateId)) {
      // Update existing template
      savedTemplate = await this.updateTemplate(templateId, {
        title: template.name,
        template,
      });
    } else {
      // Create new template
      savedTemplate = await this.createTemplate(this.projectId, template.name, template);
    }

    // Return the template with updated ID
    return {
      ...savedTemplate.template,
      id: savedTemplate.id.toString(),
    };
  }

  async resolveMedia(request: any): Promise<any> {
    // TODO: Implement media resolution
    console.warn('Media resolution not implemented yet');
    return null;
  }
}
