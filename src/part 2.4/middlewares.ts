import {type NextFunction, type Request, type Response } from 'express';
export const midlwareFunct = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.method);
    console.log('midlware');
    next();
}

export const someOtherMidFunc = (req: Request, res: Response, next: NextFunction) => {
    console.log('some Other Func is running');
    next();
}

// module.exports = midlwareFunct;