import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export async function hashStaffPassword(password){const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,32);return`scrypt$${salt}$${key.toString('hex')}`;}
export async function verifyStaffPassword(password,encoded){const match=/^scrypt\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(encoded||'');const salt=match?.[1]||'0'.repeat(32),expected=Buffer.from(match?.[2]||'0'.repeat(64),'hex');const actual=await scrypt(password,salt,32);return Boolean(match)&&timingSafeEqual(actual,expected);}
