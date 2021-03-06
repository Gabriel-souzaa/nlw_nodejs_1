import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsControllers {
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
    
        //Se uma query falhar a outra não executa
        const trx = await knex.transaction();

        const point = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }
    
        const insertedIds = await trx('points').insert(point)
    
        const point_id = insertedIds[0];
    
        const pointItems = items
            .split(',')
            .map((item: String) => Number(item.trim()))
            .map((item_id: number) => {
            return {
                item_id,
                point_id
            }
        })
    
        await trx('point_items').insert(pointItems);

        await trx.commit();
    
        return response.json({
            id: point_id,
            ...point
        })
    }

    async show (request: Request, response: Response){
        const { id } = request.params;

        const point = await knex('points').where('id',id).first();

        if(!point){
            return response.status(400).json({message: "Point not found"});
        }

        const serializadItems = {
            ...point,
            image_url: `http://localhost:3333/uploads/imagePonit/${point.image}`
        };
        
        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title')
        
        return response.status(200).json({point: serializadItems, items});
    }

    async index (request: Request, response: Response){
        const { city, uf, items } = request.query;

        const paserdItems = String(items)
            .split(',')
            .map(item => Number(item.trim()))
        
        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', paserdItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*')

        const serializadItems = points.map(point => {
            return {
                ...point,
                image_url: `http://localhost:3333/uploads/imagePonit/${point.image}`
            }
        })

        return response.json(serializadItems)
    }
}

export default PointsControllers;