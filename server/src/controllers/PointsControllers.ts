import knex from '../database/connection';
import {Request, Response } from 'express';

class PointsController {

    async index(request: Request, response: Response) {
        // cidade, uf, items (Query Params)
        const { city, uf, items } = request.query;

        const parsedItems = String(items)
        .split(',')
        .map(item => Number(item.trim()));
        

        const points = await knex('points')
        .join('points_items', 'points.id', '=', 'points_items.point_id')
        .whereIn('points_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');


        const serializedPoints = points.map(point => {
            return { 
               ...point,
                image_url: `http://192.168.1.20:3333/uploads/${point.image}`
            };
        });
       return response.json(serializedPoints);
    }

    async show(request: Request, response: Response) {
        try {
            const { id } = request.params;
    
            const point = await knex('points').where('id', id).first();



            const serializedPoint = {
                ...point,
                image_url: `http://192.168.1.20:3333/uploads/${point.image}`
            }
           



    
            if(!point) {
                return response.status(400).json({message: 'Point not found'});
            }
    
            // SELECT * FROM items
            // JOIN point_items On items.id = point_items.item_id
            // WHERE point_items.point_id = {id}
            const items = await knex('items')
            .join('points_items', 'items.id', '=', 'points_items.item_id')
            .where('points_items.point_id', id)
            .select('items.title');
            return response.json({point: serializedPoint, items});

        } catch(err) {
            console.log(err);
        }
    }


    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
        // const de cima =  const name = request.body.name
   
   
        const trx = await knex.transaction();
        // transaction = ao fazer dois inserts no banco se um falhar o outro não executa
   
        const point = {
            
                image: request.file.filename,
                name, // sort sintaxe = name: name // quando a variável é o nome da propriedade pode omitir
                email,
                whatsapp,
                latitude,
                longitude,
                city,
                uf
             
        }
       const insertedIds = await trx('points').insert(point);
   
        const point_id = insertedIds[0];
   
        const pointItems = items.split(',').map((item:  string) => Number(item.trim())).map((item_id: number) => {
            return {
                item_id,
                point_id
            }
        })
        await trx('points_items').insert(pointItems);
   

        await trx.commit();
        
        return response.json({
            id: point_id,
            ... point // ... retornar todos os dados
        });
    }
    
}
export default PointsController;