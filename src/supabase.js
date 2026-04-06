import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sedmbkgetlsbtvggpaaw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mr7yv2voMMnhhaDi1vUrMw_P-A76iBO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function saveScore(name, score) {
  await supabase.from('scores').insert({ name, game: 'clicker', score });
}

export async function getTopScores() {
  const { data } = await supabase
    .from('scores')
    .select('name, score')
    .eq('game', 'clicker')
    .order('score', { ascending: false })
    .limit(10);
  return data ?? [];
}
