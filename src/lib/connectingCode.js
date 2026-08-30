import crypto from 'crypto';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT = '0123456789';
const SPECIAL = '!@#$%^&*';
const ALL = LOWER + UPPER + DIGIT + SPECIAL;
const LENGTH = 8;

function pick(set) {
    return set[crypto.randomInt(set.length)];
}

/**
 * An 8-character code guaranteed to contain at least one lowercase letter,
 * one uppercase letter, one digit and one special character.
 */
export function generateConnectingCode() {
    const chars = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SPECIAL)];
    while (chars.length < LENGTH) chars.push(pick(ALL));

    // Fisher–Yates shuffle so the required chars aren't always in front.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
}

/**
 * Generate a code that no existing user has. `User` is the Mongoose model.
 * Retries on the astronomically unlikely collision; never returns a duplicate.
 */
export async function generateUniqueConnectingCode(User) {
    for (let attempt = 0; attempt < 25; attempt++) {
        const code = generateConnectingCode();
        const taken = await User.exists({ connectingCode: code });
        if (!taken) return code;
    }
    throw new Error('Could not generate a unique connecting code.');
}
