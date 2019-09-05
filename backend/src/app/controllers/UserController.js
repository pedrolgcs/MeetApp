import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    try {
      const { id, name, email } = await User.create(req.body);
      return res.status(201).json({ id, name, email });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      password: Yup.string().min(6),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
      oldPassword: Yup.string().when('password', (password, field) =>
        password ? field.required() : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user = await User.findByPk(req.userId);

    if (!user) return res.status(401).send({ error: 'User not found' });

    const { email = user.email, oldPassword } = req.body;

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    try {
      const { id, name } = await user.update(req.body);
      return res.status(201).json({
        id,
        name,
        email,
      });
    } catch (error) {
      return res.status(500).json(error);
    }
  }
}

export default new UserController();
