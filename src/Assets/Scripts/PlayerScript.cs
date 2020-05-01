using UnityEngine;

public class PlayerScript : MonoBehaviour {

    public ParticleSystem sparksTop;
    public ParticleSystem sparksBottom;

    public AudioClip sawClip;

    public AudioSource audioSource;

    private bool isPlaying = false;

    void OnEnable() {
        GameManager.GameOverEvent += OnGameOver;
    }

    void OnDisable() {
        GameManager.GameOverEvent -= OnGameOver;
    }

    void OnCollisionEnter2D(Collision2D other) {
        if (other.transform.tag.Equals("Wall")) {
            sparksTop.Play();
            sparksBottom.Play();
            isPlaying = true;

            audioSource.PlayOneShot(sawClip);
        }
    }

    void OnCollisionExit2D(Collision2D other) {
        if (isPlaying && other.transform.tag.Equals("Wall")) {
            sparksTop.Stop();
            sparksBottom.Stop();
            isPlaying = false;

            audioSource.Stop();
        }
    }

    void OnGameOver() {
        if (isPlaying) {
            sparksTop.Stop();
            sparksBottom.Stop();
            isPlaying = false;
        }
    }

}
