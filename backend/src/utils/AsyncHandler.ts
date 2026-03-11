import { Request, Response, NextFunction } from 'express';

type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🎯 AsyncHandler: Processing request:', req.method, req.url);
    Promise.resolve(requestHandler(req, res, next))
      .then((result) => {
        console.log('✅ AsyncHandler: Request completed successfully');
      })
      .catch((error) => {
        console.log('❌ AsyncHandler: Error caught:', error.message);
        console.log('❌ Error stack:', error.stack);
        next(error);
      });
  };
};

export default asyncHandler;
