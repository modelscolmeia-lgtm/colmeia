/**
 * Upload de imagens do catálogo.
 *
 * Se CLOUDINARY_URL estiver configurada, envia para o Cloudinary (hospedagem
 * persistente, recomendada em produção). Caso contrário, salva no disco local
 * (backend/uploads), servido em /uploads — bom para desenvolvimento, mas some
 * em redeploy no Render free.
 *
 * CLOUDINARY_URL é obtida no painel do Cloudinary, no formato:
 *   cloudinary://<api_key>:<api_secret>@<cloud_name>
 */
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_ATIVO = !!process.env.CLOUDINARY_URL;

if (CLOUDINARY_ATIVO) {
  cloudinary.config(); // lê a CLOUDINARY_URL do ambiente automaticamente
}

// Envia o buffer para o Cloudinary e devolve a URL segura (https).
function enviarCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'colmeia', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

// Salva o buffer no disco local e devolve o caminho público (/uploads/...).
function salvarLocal(buffer, originalname, uploadsDir) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(originalname || '').toLowerCase() || '.png';
  const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, nome), buffer);
  return `/uploads/${nome}`;
}

/**
 * Recebe o arquivo do multer (memória) e devolve a URL de exibição.
 * @returns {Promise<string>} URL (absoluta no Cloudinary, ou /uploads/... local)
 */
export async function salvarImagem(file, uploadsDir) {
  if (CLOUDINARY_ATIVO) return enviarCloudinary(file.buffer);
  return salvarLocal(file.buffer, file.originalname, uploadsDir);
}
