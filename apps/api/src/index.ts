import { app } from './app';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 ShopVibe API Server running on port ${PORT}`);
});
