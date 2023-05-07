import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import User from '../models/UserModel.js';
import Product from '../models/ProductModel.js';

export const getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search_query || '';
  const offset = limit * page;
  const totalRows = await Product.count({
    where: {
      [Op.or]: [
        {
          name: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    },
  });
  const totalPage = Math.ceil(totalRows / limit);
  try {
    let result;
    if (req.role === 'admin') {
      result = await Product.findAll({
        attributes: ['uuid', 'name', 'price', 'image'],
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
        ],
        where: {
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        },
        offset,
        limit,
        order: [['id', 'DESC']],
      });
    } else {
      result = await Product.findAll({
        attributes: ['uuid', 'name', 'price', 'image'],
        where: {
          userId: req.userId,
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        },
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
        ],
        offset,
        limit,
        order: [['id', 'DESC']],
      });
    }
    res.status(200).json({
      result,
      page,
      limit,
      totalRows,
      totalPage,
    });
    // res.status(200).json(response,result,page,limit,totalRows,totalPage);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// export const getProducts = async (req, res) =>{
//     try {
//         let response;
//         if(req.role === "admin"){
//             response = await Product.findAll({
//                 attributes:['uuid','name','price','image'],
//                 include:[{
//                     model: User,
//                     attributes:['name','email']
//                 }]
//             });
//         }else{
//             response = await Product.findAll({
//                 attributes:['uuid','name','price','image'],
//                 where:{
//                     userId: req.userId
//                 },
//                 include:[{
//                     model: User,
//                     attributes:['name','email']
//                 }]
//             });
//         }
//         res.status(200).json(response);
//     } catch (error) {
//         res.status(500).json({msg: error.message});
//     }
// }

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        uuid: req.params.id,
      },
    });
    if (!product) return res.status(404).json({ msg: 'Data tidak ditemukan' });
    let response;
    if (req.role === 'admin') {
      response = await Product.findOne({
        attributes: ['uuid', 'name', 'price', 'image'],
        where: {
          id: product.id,
        },
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
        ],
      });
    } else {
      response = await Product.findOne({
        attributes: ['uuid', 'name', 'price', 'image'],
        where: {
          [Op.and]: [{ id: product.id }, { userId: req.userId }],
        },
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
        ],
      });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createProduct = (req, res) => {
  if (req.files === null)
    return res.status(400).json({ msg: 'No File Uploaded' });
  const { name } = req.body;
  const { price } = req.body;
  const { file } = req.files;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + ext;
  const url = `${req.protocol}://${req.get('host')}/images/${fileName}`;
  const allowedType = ['.png', '.jpg', '.jpeg'];

  if (!allowedType.includes(ext.toLowerCase()))
    return res.status(422).json({ msg: 'Invalid Images' });
  if (fileSize > 5000000)
    return res.status(422).json({ msg: 'Image must be less than 5 MB' });

  file.mv(`./public/images/${fileName}`, async err => {
    if (err) return res.status(500).json({ msg: err.message });
    try {
      await Product.create({
        name,
        price,
        image: fileName,
        url,
        userId: req.userId,
      });
      res.status(201).json({ msg: 'Product Created Successfuly' });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  });
};
// export const createProduct = async(req, res) =>{
//     const {name, price} = req.body;
//     try {
//         await Product.create({
//             name: name,
//             price: price,
//             userId: req.userId
//         });
//         res.status(201).json({msg: "Product Created Successfuly"});
//     } catch (error) {
//         res.status(500).json({msg: error.message});
//     }
// }

// export const updateProduct = async(req, res) =>{
//     try {
//         const product = await Product.findOne({
//             where:{
//                 uuid: req.params.id
//             }
//         });
//         if(!product) return res.status(404).json({msg: "Data tidak ditemukan"});
//         const {name, price} = req.body;
//         if(req.role === "admin"){
//             await Product.update({name, price},{
//                 where:{
//                     id: product.id
//                 }
//             });
//         }else{
//             if(req.userId !== product.userId) return res.status(403).json({msg: "Akses terlarang"});
//             await Product.update({name, price},{
//                 where:{
//                     [Op.and]:[{id: product.id}, {userId: req.userId}]
//                 }
//             });
//         }
//         res.status(200).json({msg: "Product updated successfuly"});
//     } catch (error) {
//         res.status(500).json({msg: error.message});
//     }
// }

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        uuid: req.params.id,
      },
    });
    if (!product) return res.status(404).json({ msg: 'Data tidak ditemukan' });
    let fileName = '';
    if (req.files === null) {
      fileName = product.image;
    } else {
      const { file } = req.files;
      const fileSize = file.data.length;
      const ext = path.extname(file.name);
      fileName = file.md5 + ext;
      const allowedType = ['.png', '.jpg', '.jpeg'];

      if (!allowedType.includes(ext.toLowerCase()))
        return res.status(422).json({ msg: 'Invalid Images' });
      if (fileSize > 5000000)
        return res.status(422).json({ msg: 'Image must be less than 5 MB' });

      const filepath = `./public/images/${product.image}`;
      fs.unlinkSync(filepath);

      file.mv(`./public/images/${fileName}`, err => {
        if (err) return res.status(500).json({ msg: err.message });
      });
    }
    const { name } = req.body;
    const { price } = req.body;
    const url = `${req.protocol}://${req.get('host')}/images/${fileName}`;

    // const {name, price} = req.body;
    if (req.role === 'admin') {
      await Product.update(
        { name, price, image: fileName, url },
        {
          // await Product.update({name, price},{
          where: {
            id: product.id,
          },
        },
      );
    } else {
      if (req.userId !== product.userId)
        return res.status(403).json({ msg: 'Akses terlarang' });
      await Product.update(
        { name, price, image: fileName, url },
        {
          // await Product.update({name, price},{
          where: {
            [Op.and]: [{ id: product.id }, { userId: req.userId }],
          },
        },
      );
    }
    res.status(200).json({ msg: 'Product updated successfuly' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        uuid: req.params.id,
      },
    });
    if (!product) return res.status(404).json({ msg: 'Data tidak ditemukan' });
    const { name, price } = req.body;
    if (req.role === 'admin') {
      const filepath = `./public/images/${product.image}`;
      fs.unlinkSync(filepath);
      await Product.destroy({
        where: {
          id: product.id,
        },
      });
    } else {
      if (req.userId !== product.userId)
        return res.status(403).json({ msg: 'Akses terlarang' });
      const filepath = `./public/images/${product.image}`;
      fs.unlinkSync(filepath);
      await Product.destroy({
        where: {
          [Op.and]: [{ id: product.id }, { userId: req.userId }],
        },
      });
    }
    res.status(200).json({ msg: 'Product deleted successfuly' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
