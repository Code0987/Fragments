using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections;
using UnityEngine.SceneManagement;

public class UIManager : MonoBehaviour {

    private int oldScore, newScore;

    public GameObject mainMenu;
    private CanvasGroup mainMenuCanvasGroup;
    public Text title;
    public Text score;

    public Text scoreText;

    void Start() {
        oldScore = 0;

        mainMenuCanvasGroup = mainMenu.GetComponent<CanvasGroup>();

        OpenMainMenu();
    }

    void Update() {
        newScore = GameManager.Instance.Score;
        if (oldScore != newScore) {
            scoreText.text = newScore.ToString();
            oldScore = newScore;
        }

        if (GameManager.Instance.HasState(GameState.Over) && !mainMenu.activeSelf) {
            OpenMainMenu();
        }
    }

    public void OpenMainMenu() {
        GameManager.Instance.AppendState(GameState.UI);

        if (scoreText.gameObject.activeSelf)
            scoreText.gameObject.SetActive(false);

        mainMenuCanvasGroup.alpha = 0;

        if (!GameManager.Instance.HasState(GameState.Over)) {
            title.text = "FRAGMENTS";
            score.text = "";
        } else {
            title.text = "You Died!";
            score.text = "Score " + newScore.ToString() + "\n" + "High " + PlayerPrefs.GetInt("highscore").ToString();
        }

        StartCoroutine(CanvasGroupFadeCoroutine(mainMenuCanvasGroup, 0, 1, 1.2f, () => {
        }));

        mainMenu.SetActive(true);

        GameManager.Instance.PlayMusic();
    }

    public void CloseMainMenu() {
        if (!mainMenu.activeSelf)
            return;

        if (!scoreText.gameObject.activeSelf)
            scoreText.gameObject.SetActive(true);

        StartCoroutine(CanvasGroupFadeCoroutine(mainMenuCanvasGroup, 1, 0, 0.8f, () => {
            mainMenu.SetActive(false);

            GameManager.Instance.RemoveState(GameState.UI);
            GameManager.Instance.RemoveState(GameState.Over);

            GameManager.Instance.StartGame();
        }));
    }

    public void Play() {
        if (mainMenu.activeSelf) {
            CloseMainMenu();
        }
    }

    public void Restart() {
        Scene scene = SceneManager.GetActiveScene();
        SceneManager.LoadScene(scene.name);
    }

    public void Exit() {
#if !UNITY_EDITOR
        Application.Quit();
#endif

#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#endif
    }

    private IEnumerator CanvasGroupFadeCoroutine(CanvasGroup canvasGroup, float startingAlpha, float endingAlpha, float fadeDurationSeconds, Action onComplete) {
        float elapsedTime = 0;
        while (elapsedTime <= fadeDurationSeconds) {
            elapsedTime += Time.deltaTime;
            canvasGroup.alpha = Mathf.Lerp(startingAlpha, endingAlpha, elapsedTime / fadeDurationSeconds);
            yield return null;
        }
        if (onComplete != null)
            onComplete();
        yield return null;
    }

}
