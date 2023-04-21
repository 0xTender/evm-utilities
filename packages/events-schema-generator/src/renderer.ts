import { join } from 'path';
import { extensions } from './extensions';
import { readFileSync } from 'fs';
import { Liquid } from 'liquidjs';

export const renderer = async (
  extension_name: keyof typeof extensions,
  template_key: 'base_file_name' | 'file_name',
  data: any = {}
) => {
  const extension = extensions[extension_name];
  const templatePath = join(__dirname, 'templates', extension[template_key]);

  const template = readFileSync(templatePath).toString();

  if (!template) throw new Error('Template not found');

  const engine_type = extension.engine;

  if (engine_type === 'liquid') {
    const engine = new Liquid();
    const rendered = await engine.parseAndRender(template, data);

    return rendered as string;
  }
  throw new Error('Engine not supported');
};
