import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Función para subir imágenes al bucket de Supabase
export async function uploadImageToSupabase(file, folder = 'episodes') {
  try {
    if (!file) return { url: null, error: null };
    
    // Verificar que el usuario esté autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuario no autenticado');
    }
    
    // Generar un nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const uniqueId = uuidv4();
    const fileName = `${folder}_${uniqueId}.${fileExt}`;
    
    console.log('Uploading file:', { fileName, fileType: file.type, fileSize: file.size });
    
    // Subir el archivo al bucket con el usuario autenticado
    const { data, error } = await supabase.storage
      .from('instagram-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }
    
    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('instagram-images')
      .getPublicUrl(fileName);
    
    console.log('File uploaded successfully:', urlData.publicUrl);
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { 
      url: null, 
      error: {
        message: error.message || 'Error al subir la imagen',
        details: error.details || error.hint || '',
        code: error.code || ''
      }
    };
  }
}

// Funciones para la sección de Narrativa
export async function createNarrativeEpisode({
  accountId,
  title,
  description,
  closure,
  tags,
  arc,
  position,
  connections,
  imageUrl = null
}) {
  try {
    console.log('Creating episode with data:', { 
      accountId, title, description, closure, arc, 
      position, tags: tags.length, connections: connections.length,
      imageUrl: imageUrl ? 'present' : 'none'
    });
    
    // Verificar que el usuario esté autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que la cuenta pertenezca al usuario
    const { data: accountData, error: accountError } = await supabase
      .from('cuentas')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single();

    if (accountError || !accountData) {
      console.error('Error verificando cuenta:', accountError);
      throw new Error('No tienes permiso para crear episodios en esta cuenta');
    }
    
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
        image_url: imageUrl,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (episodeError) {
      console.error('Error inserting episode:', episodeError);
      throw new Error(`Error al crear el episodio: ${episodeError.message}`);
    }

    console.log('Episode created successfully:', episode);

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

      if (tagsError) {
        // Si falla la inserción de tags, eliminamos el episodio creado
        await supabase
          .from('narrative_episodes')
          .delete()
          .eq('id', episode.id);
        
        console.error('Error inserting tags:', tagsError);
        throw new Error(`Error al guardar los tags: ${tagsError.message}`);
      }
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

      if (connectionsError) {
        // Si falla la inserción de conexiones, eliminamos el episodio y los tags
        await supabase
          .from('narrative_episodes')
          .delete()
          .eq('id', episode.id);
        
        console.error('Error inserting connections:', connectionsError);
        throw new Error(`Error al guardar las conexiones: ${connectionsError.message}`);
      }
    }

    return { episode, error: null };
  } catch (error) {
    console.error('Error creating narrative episode:', error);
    return { 
      episode: null, 
      error: {
        message: error.message || 'Error desconocido',
        details: error.details || error.hint || '',
        code: error.code || ''
      }
    };
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

// Función para archivar o desarchivar un episodio
export async function toggleEpisodeArchiveStatus(episodeId, isArchived) {
  try {
    // Verificar que el usuario esté autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuario no autenticado');
    }

    // Actualizar el estado de archivo del episodio
    const { data, error } = await supabase
      .from('narrative_episodes')
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId)
      .single();

    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error toggling episode archive status:', error);
    return { 
      success: false, 
      error: {
        message: error.message || 'Error al cambiar el estado de archivo',
        details: error.details || error.hint || '',
        code: error.code || ''
      }
    };
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
