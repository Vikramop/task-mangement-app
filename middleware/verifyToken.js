import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  //   console.log('Authorization Header:', authHeader);
  //   console.log('Extracted Token:', token);

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized- no token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('decoded', decoded);

    if (!decoded)
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized - invlaid token' });
    req.userId = decoded._id;
    // console.log('user id', req.userId);

    next();
  } catch (error) {
    console.log('Error in verifyToken', error);
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized - invalid token' });
  }
};
