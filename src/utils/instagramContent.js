import { supabase } from './supabaseClient';

// Funciones para la sección de Narrativa
export async function createNarrativeEpisode({
  accountId,
  title,
  description,
  closure,
  tags,
  arc,
  position,
  connections
}) {
  try {
    // Primero guardamos el episodio
    const { data: episode, error: episodeError } = await supabase
      .from('narrative_episodes')
      .insert([{
        account_id: accountId,
        title,
        description,
        closure_type: closure,
        arc_name: arc,
        position_x: position.x,
        position_y: position.y,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (episodeError) throw episodeError;

    // Guardamos los tags
    if (tags.length > 0) {
      const { error: tagsError } = await supabase
        .from('episode_tags')
        .insert(
          tags.map(tag => ({
            episode_id: episode.id,
            tag_name: tag
          }))
        );

      if (tagsError) throw tagsError;
    }

    // Guardamos las conexiones
    if (connections.length > 0) {
      const { error: connectionsError } = await supabase
        .from('episode_connections')
        .insert(
          connections.map(conn => ({
            from_episode_id: conn.start,
            to_episode_id: conn.end
          }))
        );

      if (connectionsError) throw connectionsError;
    }

    return { episode, error: null };
  } catch (error) {
    console.error('Error creating narrative episode:', error);
    return { episode: null, error };
  }
}

export async function getNarrativeEpisodes(accountId) {
  try {
    // Obtenemos los episodios
    const { data: episodes, error: episodesError } = await supabase
      .from('narrative_episodes')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });

    if (episodesError) throw episodesError;

    // Obtenemos los tags para todos los episodios
    const { data: tags, error: tagsError } = await supabase
      .from('episode_tags')
      .select('*')
      .in('episode_id', episodes.map(ep => ep.id));

    if (tagsError) throw tagsError;

    // Obtenemos las conexiones
    const { data: connections, error: connectionsError } = await supabase
      .from('episode_connections')
      .select('*')
      .in('from_episode_id', episodes.map(ep => ep.id));

    if (connectionsError) throw connectionsError;

    // Organizamos los datos
    const episodesWithDetails = episodes.map(episode => ({
      ...episode,
      tags: tags
        .filter(tag => tag.episode_id === episode.id)
        .map(tag => tag.tag_name),
      connections: connections
        .filter(conn => conn.from_episode_id === episode.id)
        .map(conn => ({
          start: conn.from_episode_id,
          end: conn.to_episode_id
        }))
    }));

    return { episodes: episodesWithDetails, error: null };
  } catch (error) {
    console.error('Error fetching narrative episodes:', error);
    return { episodes: [], error };
  }
}

// Funciones para las secciones Personal y Behind the Scenes
export async function createSimplePost({
  accountId,
  type,
  description,
  imageUrl = null
}) {
  try {
    const { data: post, error } = await supabase
      .from('simple_posts')
      .insert([{
        account_id: accountId,
        post_type: type, // 'personal' o 'behindScenes'
        description,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { post, error: null };
  } catch (error) {
    console.error('Error creating simple post:', error);
    return { post: null, error };
  }
}

export async function getSimplePosts(accountId, type) {
  try {
    const { data: posts, error } = await supabase
      .from('simple_posts')
      .select('*')
      .eq('account_id', accountId)
      .eq('post_type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { posts, error: null };
  } catch (error) {
    console.error('Error fetching simple posts:', error);
    return { posts: [], error };
  }
}
