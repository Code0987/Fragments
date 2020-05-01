using UnityEngine;
using System;

[System.Flags]
public enum GameState : int {
    None = 0,
    Running = 1 << 1,
    Paused = 1 << 2,
    Over = 1 << 3,
    UI = 1 << 4,
    Tutorial = 1 << 10
}

public class GameManager : MonoBehaviour {

    public static GameManager Instance;

    #region Events

    public delegate void Call();

    public static event Call GameOverEvent;

    public static void CallGameOver() {
        if (GameOverEvent != null)
            GameOverEvent();
    }

    #endregion

    #region State

    public GameState State;

    public bool HasState(GameState state) {
        return (State & state) != GameState.None;
    }

    public void AppendState(GameState state) {
        State |= state;
    }

    public void RemoveState(GameState state) {
        State &= ~state;
    }

    #endregion

    public InputManager inputManager;

    public PlayerManager playerManager;

    public ObstacleGenerator obstacleGenerator;

    private float score;

    public int Score { get { return (int)score; } }

    private const float SPEED = 6.6f;

    public float Speed = SPEED;

    void Awake() {
        if (Instance == null)
            Instance = this;
        else if (Instance != this)
            Destroy(gameObject);
        // DontDestroyOnLoad(gameObject);

        AppendState(GameState.None);
    }

    void Start() {
        GameOverEvent += GameOver;

        RemoveState(GameState.None);
        AppendState(GameState.UI);
    }

    void OnDisable() {
        GameOverEvent -= GameOver;
    }

    private void GameOver() {
        AppendState(GameState.Over);

        Speed = 6.5f;
    }

    void Update() {
        if (playerManager != null && !HasState(GameState.Over) && !HasState(GameState.UI)) {
            playerManager.Move(inputManager.MappedInput);
        }
    }

    void FixedUpdate() {
        if (!HasState(GameState.Over | GameState.UI)) {
            Speed += Time.deltaTime / 7;
        }
    }

    void OnTriggerExit2D(Collider2D other) {
        if (other.tag.Equals("SpikeBoth")) {
            score += (Speed/SPEED) * 0.7f;
        } else if (other.tag.Equals("SpikeOther")) {
            score += (Speed/SPEED) * 1.1f;
        }

        if (score > PlayerPrefs.GetInt("highscore")) {
            PlayerPrefs.SetInt("highscore", (int)score);
        }
    }

    public void StartGame() {
        if (playerManager != null) {
            playerManager.Spawn();
        }

        if (obstacleGenerator !=null) {
            obstacleGenerator.IsGenerating = true;
        }

        score = 0;
        Speed = SPEED;

        RemoveState(GameState.Paused);
        RemoveState(GameState.Over);
        RemoveState(GameState.UI);
    }
    public void StopGame() {
        if (playerManager != null) {
            playerManager.Kill();
        }

        if (obstacleGenerator !=null) {
            obstacleGenerator.IsGenerating = false;
        }

        RemoveState(GameState.Paused);
    }

    #region Sounds

    public AudioSource[] SoundAudioSources;
    public AudioSource[] MusicAudioSources;

    public void PlaySound(int index) {
        SoundAudioSources[index].PlayOneShotSoundManaged(SoundAudioSources[index].clip);
    }

    public void PlaySound(AudioClip audioClip) {
        SoundAudioSources[0].PlayOneShotSoundManaged(audioClip);
    }

    public void PlaySound(AudioClip audioClip, float volumeScale) {
        SoundAudioSources[0].PlayOneShotSoundManaged(audioClip, volumeScale);
    }

    public void PlayMusic(int index) {
        MusicAudioSources[index].PlayLoopingMusicManaged(1.0f, 1.0f, true);
    }

    public void PlayMusic() {
        PlayMusic(UnityEngine.Random.Range(0, MusicAudioSources.Length));
    }

    #endregion

}
