using UnityEngine;

public class CameraController : MonoBehaviour {

    public GameObject player;
    private Vector3 playerPosition;
    private Vector3 initialCameraPosition;

    void Start() {
        initialCameraPosition = transform.position;
        playerPosition = new Vector3();

        GameManager.GameOverEvent += OnGameOver;
    }

    void OnDisable() {
        GameManager.GameOverEvent -= OnGameOver;
    }

    void Update() {
        if (!GameManager.Instance.HasState(GameState.Over)) {
            playerPosition.Set((player.transform.GetChild(0).position.x + player.transform.GetChild(1).position.x) / 2, 0, 0);

            transform.position = initialCameraPosition + playerPosition / 10;
        }
    }

    void OnGameOver() {
        transform.GetComponent<Animator>().SetTrigger("GameOver");
    }
}
