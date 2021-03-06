import * as Yup from 'yup';
import User from '../models/User';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;

    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid({ email, password }))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'User not found ' });

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = user;

    return res.json({
      id,
      name,
      email,
      token: await user.generateToken(id),
    });
  }
}

export default new SessionController();
