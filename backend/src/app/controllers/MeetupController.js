import * as Yup from 'yup';
import { Op } from 'sequelize';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      attributes: ['id', 'title', 'description', 'location', 'date', 'past'],
      order: [['date', 'DESC']],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.send(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }

    const checkAvailability = await Meetup.findOne({
      where: { user_id: req.userId, date: req.body.date },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    try {
      const meetup = await Meetup.create({
        ...req.body,
        user_id: req.userId,
      });
      return res.status(201).json(meetup);
    } catch (error) {
      return res.status(400).json(error);
    }
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user_id = req.userId;
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== user_id) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups." });
    }

    const checkAvailability = await Meetup.findOne({
      where: {
        user_id: req.userId,
        date: req.body.date,
        id: {
          [Op.ne]: meetup.id,
        },
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    await meetup.update(req.body);

    return res.status(201).json(meetup);
  }

  async delete(req, res) {
    try {
      const meetup = await Meetup.findByPk(req.params.id);

      if (meetup.user_id !== req.userId) {
        return res.status(401).json({ error: 'Not authorized.' });
      }

      if (meetup.past) {
        return res.status(400).json({ error: "Can't delete past meetups." });
      }

      await meetup.destroy();
      return res.send();
    } catch (error) {
      return res.status(400).json({ error: 'Fail to remove meetup' });
    }
  }
}

export default new MeetupController();
