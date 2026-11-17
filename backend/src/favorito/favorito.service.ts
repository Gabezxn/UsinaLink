import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorito } from '../common/entities/core.entities';

const TIPOS = ['peca', 'usina'];

@Injectable()
export class FavoritoService {
  constructor(@InjectRepository(Favorito) private readonly favoritos: Repository<Favorito>) {}

  listar(idUsuario: number) {
    return this.favoritos.find({ where: { idUsuario }, order: { criadoEm: 'DESC' } });
  }

  /** Liga/desliga o favorito. Devolve o estado final. */
  async alternar(idUsuario: number, tipo: string, idReferencia: number) {
    if (!TIPOS.includes(tipo) || !Number.isInteger(idReferencia) || idReferencia < 1) throw new BadRequestException('Favorito inválido.');
    const existente = await this.favoritos.findOne({ where: { idUsuario, tipo, idReferencia } });
    if (existente) {
      await this.favoritos.delete({ idFavorito: existente.idFavorito });
      return { favorito: false, tipo, idReferencia };
    }
    await this.favoritos.save(this.favoritos.create({ idUsuario, tipo, idReferencia }));
    return { favorito: true, tipo, idReferencia };
  }
}
