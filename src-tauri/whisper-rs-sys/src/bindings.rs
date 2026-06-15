/* Hand-written bindings for whisper.cpp on Windows MSVC */

pub const WHISPER_SAMPLE_RATE: u32 = 16000;
pub const WHISPER_N_FFT: u32 = 400;
pub const WHISPER_HOP_LENGTH: u32 = 160;
pub const WHISPER_CHUNK_SIZE: u32 = 30;

// ggml log levels
pub const ggml_log_level_GGML_LOG_LEVEL_NONE: i32 = 0;
pub const ggml_log_level_GGML_LOG_LEVEL_INFO: i32 = 1;
pub const ggml_log_level_GGML_LOG_LEVEL_WARN: i32 = 2;
pub const ggml_log_level_GGML_LOG_LEVEL_ERROR: i32 = 3;
pub const ggml_log_level_GGML_LOG_LEVEL_DEBUG: i32 = 4;
pub const ggml_log_level_GGML_LOG_LEVEL_CONT: i32 = 5;

pub type ggml_log_level = i32;

// whisper_gretype constants (bindgen-style names)
pub const whisper_gretype_WHISPER_GRETYPE_END: i32 = 0;
pub const whisper_gretype_WHISPER_GRETYPE_ALT: i32 = 1;
pub const whisper_gretype_WHISPER_GRETYPE_RULE_REF: i32 = 2;
pub const whisper_gretype_WHISPER_GRETYPE_CHAR: i32 = 3;
pub const whisper_gretype_WHISPER_GRETYPE_CHAR_NOT: i32 = 4;
pub const whisper_gretype_WHISPER_GRETYPE_CHAR_RNG_UPPER: i32 = 5;
pub const whisper_gretype_WHISPER_GRETYPE_CHAR_ALT: i32 = 6;

pub type whisper_gretype = i32;

// whisper_sampling_strategy constants (bindgen-style names)
pub const whisper_sampling_strategy_WHISPER_SAMPLING_GREEDY: i32 = 0;
pub const whisper_sampling_strategy_WHISPER_SAMPLING_BEAM_SEARCH: i32 = 1;

// whisper_alignment_heads_preset constants (bindgen-style names)
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_NONE: i32 = 0;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_N_TOP_MOST: i32 = 1;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_CUSTOM: i32 = 2;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_TINY_EN: i32 = 3;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_TINY: i32 = 4;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_BASE_EN: i32 = 5;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_BASE: i32 = 6;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_SMALL_EN: i32 = 7;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_SMALL: i32 = 8;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_MEDIUM_EN: i32 = 9;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_MEDIUM: i32 = 10;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_LARGE_V1: i32 = 11;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_LARGE_V2: i32 = 12;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_LARGE_V3: i32 = 13;
pub const whisper_alignment_heads_preset_WHISPER_AHEADS_LARGE_V3_TURBO: i32 = 14;

// Old-style constant names (for compatibility)
pub const WHISPER_SAMPLING_GREEDY: i32 = 0;
pub const WHISPER_SAMPLING_BEAM_SEARCH: i32 = 1;

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_context {
    _unused: [u8; 0],
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_state {
    _unused: [u8; 0],
}

pub type whisper_pos = i32;
pub type whisper_token = i32;
pub type whisper_seq_id = i32;

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_ahead {
    pub n_text_layer: ::std::os::raw::c_int,
    pub n_head: ::std::os::raw::c_int,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_aheads {
    pub n_heads: usize,
    pub heads: *const whisper_ahead,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_context_params {
    pub use_gpu: bool,
    pub flash_attn: bool,
    pub gpu_device: ::std::os::raw::c_int,
    pub dtw_token_timestamps: bool,
    pub dtw_aheads_preset: i32,
    pub dtw_n_top: ::std::os::raw::c_int,
    pub dtw_aheads: whisper_aheads,
    pub dtw_mem_size: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_token_data {
    pub id: whisper_token,
    pub tid: whisper_token,
    pub p: f32,
    pub plog: f32,
    pub pt: f32,
    pub ptsum: f32,
    pub t0: i64,
    pub t1: i64,
    pub t_dtw: i64,
    pub vlen: f32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_model_loader {
    pub context: *mut ::std::os::raw::c_void,
    pub read: Option<unsafe extern "C" fn(*mut ::std::os::raw::c_void, *mut ::std::os::raw::c_void, usize) -> usize>,
    pub eof: Option<unsafe extern "C" fn(*mut ::std::os::raw::c_void) -> bool>,
    pub close: Option<unsafe extern "C" fn(*mut ::std::os::raw::c_void)>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_grammar_element {
    pub type_: whisper_gretype,
    pub value: u32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_timings {
    pub sample_ms: f32,
    pub encode_ms: f32,
    pub decode_ms: f32,
    pub batchd_ms: f32,
    pub prompt_ms: f32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_full_params_greedy {
    pub best_of: ::std::os::raw::c_int,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_full_params_beam_search {
    pub beam_size: ::std::os::raw::c_int,
    pub patience: f32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct whisper_full_params {
    pub strategy: i32,
    pub n_threads: ::std::os::raw::c_int,
    pub n_max_text_ctx: ::std::os::raw::c_int,
    pub offset_ms: ::std::os::raw::c_int,
    pub duration_ms: ::std::os::raw::c_int,
    pub translate: bool,
    pub no_context: bool,
    pub no_timestamps: bool,
    pub single_segment: bool,
    pub print_special: bool,
    pub print_progress: bool,
    pub print_realtime: bool,
    pub print_timestamps: bool,
    pub token_timestamps: bool,
    pub thold_pt: f32,
    pub thold_ptsum: f32,
    pub max_len: ::std::os::raw::c_int,
    pub split_on_word: bool,
    pub max_tokens: ::std::os::raw::c_int,
    pub debug_mode: bool,
    pub audio_ctx: ::std::os::raw::c_int,
    pub tdrz_enable: bool,
    pub suppress_regex: *const ::std::os::raw::c_char,
    pub initial_prompt: *const ::std::os::raw::c_char,
    pub prompt_tokens: *const whisper_token,
    pub prompt_n_tokens: ::std::os::raw::c_int,
    pub language: *const ::std::os::raw::c_char,
    pub detect_language: bool,
    pub suppress_blank: bool,
    pub suppress_nst: bool,
    pub temperature: f32,
    pub max_initial_ts: f32,
    pub length_penalty: f32,
    pub temperature_inc: f32,
    pub entropy_thold: f32,
    pub logprob_thold: f32,
    pub no_speech_thold: f32,
    pub greedy: whisper_full_params_greedy,
    pub beam_search: whisper_full_params_beam_search,
    pub new_segment_callback: Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, ::std::os::raw::c_int, *mut ::std::os::raw::c_void)>,
    pub new_segment_callback_user_data: *mut ::std::os::raw::c_void,
    pub progress_callback: Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, ::std::os::raw::c_int, *mut ::std::os::raw::c_void)>,
    pub progress_callback_user_data: *mut ::std::os::raw::c_void,
    pub encoder_begin_callback: Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, *mut ::std::os::raw::c_void) -> bool>,
    pub encoder_begin_callback_user_data: *mut ::std::os::raw::c_void,
    pub abort_callback: Option<unsafe extern "C" fn(*mut ::std::os::raw::c_void) -> bool>,
    pub abort_callback_user_data: *mut ::std::os::raw::c_void,
    pub logits_filter_callback: Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, *const whisper_token_data, ::std::os::raw::c_int, *mut f32, *mut ::std::os::raw::c_void)>,
    pub logits_filter_callback_user_data: *mut ::std::os::raw::c_void,
    pub grammar_rules: *const *const whisper_grammar_element,
    pub n_grammar_rules: usize,
    pub i_start_rule: usize,
    pub grammar_penalty: f32,
}

pub type whisper_new_segment_callback = Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, ::std::os::raw::c_int, *mut ::std::os::raw::c_void)>;
pub type whisper_progress_callback = Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, ::std::os::raw::c_int, *mut ::std::os::raw::c_void)>;
pub type whisper_encoder_begin_callback = Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, *mut ::std::os::raw::c_void) -> bool>;
pub type whisper_logits_filter_callback = Option<unsafe extern "C" fn(*mut whisper_context, *mut whisper_state, *const whisper_token_data, ::std::os::raw::c_int, *mut f32, *mut ::std::os::raw::c_void)>;
pub type ggml_abort_callback = Option<unsafe extern "C" fn(*mut ::std::os::raw::c_void) -> bool>;
pub type ggml_log_callback = Option<unsafe extern "C" fn(ggml_log_level, *const ::std::os::raw::c_char, *mut ::std::os::raw::c_void)>;

// ggml backend types (opaque pointers for vulkan support)
#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct ggml_backend_buffer_type {
    _unused: [u8; 0],
}
pub type ggml_backend_buffer_type_t = *mut ggml_backend_buffer_type;

extern "C" {
    // ggml cpu feature detection
    pub fn ggml_cpu_has_avx() -> ::std::os::raw::c_int;
    pub fn ggml_cpu_has_avx2() -> ::std::os::raw::c_int;
    pub fn ggml_cpu_has_fma() -> ::std::os::raw::c_int;
    pub fn ggml_cpu_has_f16c() -> ::std::os::raw::c_int;

    // ggml vulkan (stub implementations - will only be linked if vulkan feature is enabled)
    pub fn ggml_backend_vk_get_device_count() -> ::std::os::raw::c_int;
    pub fn ggml_backend_vk_get_device_description(device: ::std::os::raw::c_int, desc: *mut ::std::os::raw::c_char, size: usize) -> bool;
    pub fn ggml_backend_vk_get_device_memory(device: ::std::os::raw::c_int, free: *mut usize, total: *mut usize);
    pub fn ggml_backend_vk_buffer_type(device: usize) -> ggml_backend_buffer_type_t;

    // whisper context init
    pub fn whisper_init_from_file_with_params(path_model: *const ::std::os::raw::c_char, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_from_buffer_with_params(buffer: *mut ::std::os::raw::c_void, buffer_size: usize, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_with_params(loader: *mut whisper_model_loader, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_from_file_with_params_no_state(path_model: *const ::std::os::raw::c_char, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_from_buffer_with_params_no_state(buffer: *mut ::std::os::raw::c_void, buffer_size: usize, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_with_params_no_state(loader: *mut whisper_model_loader, params: whisper_context_params) -> *mut whisper_context;
    pub fn whisper_init_state(ctx: *mut whisper_context) -> *mut whisper_state;

    // whisper free
    pub fn whisper_free(ctx: *mut whisper_context);
    pub fn whisper_free_state(state: *mut whisper_state);
    pub fn whisper_free_params(params: *mut whisper_full_params);
    pub fn whisper_free_context_params(params: *mut whisper_context_params);

    // whisper audio processing
    pub fn whisper_pcm_to_mel(ctx: *mut whisper_context, samples: *const f32, n_samples: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_pcm_to_mel_with_state(ctx: *mut whisper_context, state: *mut whisper_state, samples: *const f32, n_samples: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_set_mel(ctx: *mut whisper_context, data: *const f32, n_len: ::std::os::raw::c_int, n_mel: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_set_mel_with_state(ctx: *mut whisper_context, state: *mut whisper_state, data: *const f32, n_len: ::std::os::raw::c_int, n_mel: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_encode(ctx: *mut whisper_context, offset: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_encode_with_state(ctx: *mut whisper_context, state: *mut whisper_state, offset: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_decode(ctx: *mut whisper_context, tokens: *const whisper_token, n_tokens: ::std::os::raw::c_int, n_past: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_decode_with_state(ctx: *mut whisper_context, state: *mut whisper_state, tokens: *const whisper_token, n_tokens: ::std::os::raw::c_int, n_past: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_tokenize(ctx: *mut whisper_context, text: *const ::std::os::raw::c_char, tokens: *mut whisper_token, n_max_tokens: ::std::os::raw::c_int) -> ::std::os::raw::c_int;

    // whisper language
    pub fn whisper_lang_max_id() -> ::std::os::raw::c_int;
    pub fn whisper_lang_id(lang: *const ::std::os::raw::c_char) -> ::std::os::raw::c_int;
    pub fn whisper_lang_str(id: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_lang_str_full(id: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_lang_auto_detect(ctx: *mut whisper_context, offset_ms: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int, lang_probs: *mut f32) -> ::std::os::raw::c_int;
    pub fn whisper_lang_auto_detect_with_state(ctx: *mut whisper_context, state: *mut whisper_state, offset_ms: ::std::os::raw::c_int, n_threads: ::std::os::raw::c_int, lang_probs: *mut f32) -> ::std::os::raw::c_int;

    // whisper model info
    pub fn whisper_n_len(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_n_len_from_state(state: *mut whisper_state) -> ::std::os::raw::c_int;
    pub fn whisper_n_vocab(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_n_text_ctx(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_n_audio_ctx(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_is_multilingual(ctx: *mut whisper_context) -> ::std::os::raw::c_int;

    pub fn whisper_model_n_vocab(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_audio_ctx(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_audio_state(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_audio_head(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_audio_layer(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_text_ctx(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_text_state(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_text_head(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_text_layer(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_n_mels(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_ftype(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_model_type(ctx: *mut whisper_context) -> ::std::os::raw::c_int;

    pub fn whisper_get_logits(ctx: *mut whisper_context) -> *mut f32;
    pub fn whisper_get_logits_from_state(state: *mut whisper_state) -> *mut f32;

    // whisper tokens
    pub fn whisper_token_to_str(ctx: *mut whisper_context, token: whisper_token) -> *const ::std::os::raw::c_char;
    pub fn whisper_model_type_readable(ctx: *mut whisper_context) -> *const ::std::os::raw::c_char;

    pub fn whisper_token_eot(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_sot(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_solm(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_prev(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_nosp(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_not(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_beg(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_lang(ctx: *mut whisper_context, lang_id: ::std::os::raw::c_int) -> whisper_token;
    pub fn whisper_token_translate(ctx: *mut whisper_context) -> whisper_token;
    pub fn whisper_token_transcribe(ctx: *mut whisper_context) -> whisper_token;

    // whisper timings
    pub fn whisper_get_timings(ctx: *mut whisper_context) -> *mut whisper_timings;
    pub fn whisper_print_timings(ctx: *mut whisper_context);
    pub fn whisper_reset_timings(ctx: *mut whisper_context);
    pub fn whisper_print_system_info() -> *const ::std::os::raw::c_char;

    // whisper default params
    pub fn whisper_context_default_params_by_ref() -> *mut whisper_context_params;
    pub fn whisper_context_default_params() -> whisper_context_params;
    pub fn whisper_full_default_params_by_ref(strategy: i32) -> *mut whisper_full_params;
    pub fn whisper_full_default_params(strategy: i32) -> whisper_full_params;

    // whisper full transcription
    pub fn whisper_full(ctx: *mut whisper_context, params: whisper_full_params, samples: *const f32, n_samples: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_full_with_state(ctx: *mut whisper_context, state: *mut whisper_state, params: whisper_full_params, samples: *const f32, n_samples: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_full_parallel(ctx: *mut whisper_context, params: whisper_full_params, samples: *const f32, n_samples: ::std::os::raw::c_int, n_processors: ::std::os::raw::c_int) -> ::std::os::raw::c_int;

    // whisper segment access
    pub fn whisper_full_n_segments(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_full_n_segments_from_state(state: *mut whisper_state) -> ::std::os::raw::c_int;
    pub fn whisper_full_lang_id(ctx: *mut whisper_context) -> ::std::os::raw::c_int;
    pub fn whisper_full_lang_id_from_state(state: *mut whisper_state) -> ::std::os::raw::c_int;

    pub fn whisper_full_get_segment_t0(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> i64;
    pub fn whisper_full_get_segment_t0_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int) -> i64;
    pub fn whisper_full_get_segment_t1(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> i64;
    pub fn whisper_full_get_segment_t1_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int) -> i64;

    pub fn whisper_full_get_segment_speaker_turn_next(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> bool;
    pub fn whisper_full_get_segment_speaker_turn_next_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int) -> bool;

    pub fn whisper_full_get_segment_text(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_full_get_segment_text_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;

    pub fn whisper_full_n_tokens(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_full_n_tokens_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int) -> ::std::os::raw::c_int;

    pub fn whisper_full_get_token_text(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_full_get_token_text_from_state(ctx: *mut whisper_context, state: *mut whisper_state, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_full_get_token_id(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> whisper_token;
    pub fn whisper_full_get_token_id_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> whisper_token;
    pub fn whisper_full_get_token_data(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> whisper_token_data;
    pub fn whisper_full_get_token_data_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> whisper_token_data;
    pub fn whisper_full_get_token_p(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> f32;
    pub fn whisper_full_get_token_p_from_state(state: *mut whisper_state, i_segment: ::std::os::raw::c_int, i_token: ::std::os::raw::c_int) -> f32;

    pub fn whisper_full_get_segment_no_speech_prob(ctx: *mut whisper_context, i_segment: ::std::os::raw::c_int) -> f32;

    // whisper benchmarks
    pub fn whisper_bench_memcpy(n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_bench_memcpy_str(n_threads: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;
    pub fn whisper_bench_ggml_mul_mat(n_threads: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
    pub fn whisper_bench_ggml_mul_mat_str(n_threads: ::std::os::raw::c_int) -> *const ::std::os::raw::c_char;

    // ggml logging
    pub fn ggml_log_set(log_callback: ggml_log_callback, user_data: *mut ::std::os::raw::c_void);

    // whisper logging
    pub fn whisper_log_set(log_callback: ggml_log_callback, user_data: *mut ::std::os::raw::c_void);

    // whisper openvino
    pub fn whisper_ctx_init_openvino_encoder_with_state(ctx: *mut whisper_context, state: *mut whisper_state, model_path: *const ::std::os::raw::c_char, device: *const ::std::os::raw::c_char, cache_dir: *const ::std::os::raw::c_char) -> ::std::os::raw::c_int;
    pub fn whisper_ctx_init_openvino_encoder(ctx: *mut whisper_context, model_path: *const ::std::os::raw::c_char, device: *const ::std::os::raw::c_char, cache_dir: *const ::std::os::raw::c_char) -> ::std::os::raw::c_int;

    pub fn whisper_token_count(ctx: *mut whisper_context, text: *const ::std::os::raw::c_char) -> ::std::os::raw::c_int;
}
