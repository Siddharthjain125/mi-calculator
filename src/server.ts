import 'reflect-metadata';
import { createApp } from './app';

const port = process.env.PORT || 3000;
const app = createApp();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MI calculator service listening on port ${port}`);
});
