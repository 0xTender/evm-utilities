import { join } from 'path';
import { readFileSync } from 'fs';
import { Liquid } from 'liquidjs';

export const renderers = {
  postgres: {
    name: 'postgres',
    base_file_name: 'base_postgres.liquid',
    file_name: 'postgres.liquid',
    migration: 'postgres_migration.liquid',
    engine: 'liquid',
  },
};

export const renderer = async (
  renderer_name: keyof typeof renderers,
  template_key: 'base_file_name' | 'file_name'| 'migration',
  data: any = {}
) => {
  const renderer = renderers[renderer_name];
  const templatePath = join(__dirname, 'templates', renderer[template_key]);

  const template = readFileSync(templatePath).toString();

  if (!template) throw new Error('Template not found');

  const engine_type = renderer.engine;

  if (engine_type === 'liquid') {
    const engine = new Liquid();
    const rendered = await engine.parseAndRender(template, data);

    return rendered as string;
  }
  throw new Error('Engine not supported');
};
