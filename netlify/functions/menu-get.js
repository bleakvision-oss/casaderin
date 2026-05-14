import { json, loadMenu } from './_shared.js';

export default async () => {
  const data = await loadMenu();
  return json(200, data);
};
