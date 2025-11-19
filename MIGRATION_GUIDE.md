# Migration from Supabase to Express + MongoDB

## Overview
This document outlines the complete migration from Supabase to a custom Express.js backend with MongoDB database.

## What Was Changed

### Backend (New)
- **Express.js Server**: RESTful API with TypeScript
- **MongoDB Database**: Document-based storage with Mongoose ODM
- **JWT Authentication**: Token-based authentication system
- **Role-based Access Control**: Admin, Manager, Employee, Viewer roles
- **Comprehensive API**: Full CRUD operations for all entities

### Frontend (Updated)
- **API Service**: New `src/services/api.ts` replaces Supabase client
- **Authentication**: Updated `AuthContext` to use JWT tokens
- **Database Service**: Modified to use API calls with localStorage fallback
- **Environment Variables**: Uses `VITE_API_URL` for backend connection

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
# Copy .env.example to .env and update values:
# MONGODB_URI=mongodb://localhost:27017/lazher
# JWT_SECRET=your-super-secret-jwt-key
# PORT=3001
# FRONTEND_URL=http://localhost:5173

# Start MongoDB (if using local installation)
# Windows: Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# In the main project directory
# Create environment file
# Copy .env.example to .env.local:
# VITE_API_URL=http://localhost:3001/api

# Start the frontend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Data Management
- **Chickens**: `/api/chickens/*`
- **Eggs**: `/api/eggs/*`
- **Sales**: `/api/sales/*`
- **Expenses**: `/api/expenses/*`
- **Cartons**: `/api/cartons/*`
- **Users**: `/api/users/*`
- **Dashboard**: `/api/dashboard/*`

## Key Differences from Supabase

### Authentication
- **Before**: Supabase Auth with email/password
- **After**: JWT tokens with custom user management
- **Migration**: Users need to register again (no automatic migration)

### Database
- **Before**: PostgreSQL with Supabase
- **After**: MongoDB with Mongoose schemas
- **Migration**: Data needs to be manually migrated or re-entered

### Real-time Features
- **Before**: Supabase real-time subscriptions
- **After**: Polling-based updates (can be enhanced with WebSockets)

### File Storage
- **Before**: Supabase Storage
- **After**: Not implemented (can be added with multer + cloud storage)

## Benefits of Migration

1. **Full Control**: Complete control over backend logic and database
2. **Cost Effective**: No subscription fees for database usage
3. **Customization**: Easy to customize and extend functionality
4. **Performance**: Optimized queries and data structures
5. **Security**: Custom security implementation
6. **Scalability**: Can scale independently

## Fallback Strategy

The frontend includes a fallback mechanism:
- If API calls fail, the app falls back to localStorage
- This ensures the app continues working even if the backend is down
- Data can be synced when the backend comes back online

## Testing the Migration

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `npm run dev`
3. **Test Registration**: Create a new user account
4. **Test Login**: Login with the new account
5. **Test Data Operations**: Try creating chickens, eggs, sales, etc.
6. **Check Console**: Monitor for any API errors

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify MongoDB service status

2. **CORS Errors**
   - Check FRONTEND_URL in backend .env
   - Ensure frontend URL matches exactly

3. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration (7 days default)
   - Clear localStorage and re-login

4. **API Connection Errors**
   - Verify VITE_API_URL in frontend .env.local
   - Check if backend is running on correct port
   - Test with: `curl http://localhost:3001/api/health`

### Debug Steps

1. Check backend logs for errors
2. Check browser console for API errors
3. Test API endpoints directly with Postman/curl
4. Verify environment variables are loaded
5. Check MongoDB connection status

## Next Steps

1. **Data Migration**: If you have existing Supabase data, create migration scripts
2. **File Upload**: Implement file upload functionality if needed
3. **Real-time Updates**: Add WebSocket support for real-time features
4. **Backup Strategy**: Implement database backup and restore
5. **Monitoring**: Add logging and monitoring tools
6. **Production Deployment**: Deploy to cloud services (AWS, DigitalOcean, etc.)

## Support

If you encounter issues:
1. Check the backend logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check MongoDB connection
5. Review the README.md in the backend directory
