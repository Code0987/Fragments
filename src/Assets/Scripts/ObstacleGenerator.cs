using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;

public class ObstacleGenerator : MonoBehaviour {

    [System.Serializable]
    public class Obstacles {
        public GameObject spikeLeft;
        public GameObject spikeRight;
        public GameObject spikeBoth;
        public GameObject spikeCenter;
        public GameObject blocks;
    }

    public Obstacles obstacles;
    private SpecialQueue queue = new SpecialQueue();
    private Dictionary<int,ObjectPooler> objectPoolers;
    private int spikeId = 0;

    private int maxObstacleId = 5;
    private int spikesGenerated = 0;
    public int threshold = 40;

    private float waitTime = 0;

    void Start() {
        objectPoolers = new Dictionary<int, ObjectPooler>(5);
        InitObjectPools();

        spikeId = GetspikeId(queue);

        spikesGenerated = 1;
    }

    void OnEnable() {
        GameManager.GameOverEvent += OnGameOver;
    }

    void OnDisable() {
        GameManager.GameOverEvent -= OnGameOver;
    }

    public bool IsGenerating = false;

    void Update() {
        if (IsGenerating) {
            if (waitTime > 0) {
                waitTime -= Time.deltaTime;
                return;
            }

            Spawn(objectPoolers[spikeId].GetPooledObject());

            spikeId = GetspikeId(queue);

            if (queue.IsCenterSpike())
                waitTime = 1.3f / GameManager.Instance.Speed * 6.5f;
            else
                waitTime = 1.1f / GameManager.Instance.Speed * 6.5f;

            spikesGenerated++;

            if (spikesGenerated > threshold) {
                if (maxObstacleId == 5) {
                    maxObstacleId = 6;
                }
            }
        }
    }

    void OnGameOver() {
        IsGenerating = false;
    }


    private void InitObjectPools() {
        objectPoolers[1] = new ObjectPooler(obstacles.spikeLeft, 3);
        objectPoolers[2] = new ObjectPooler(obstacles.spikeRight, 3);
        objectPoolers[3] = new ObjectPooler(obstacles.spikeBoth, 3);
        objectPoolers[4] = new ObjectPooler(obstacles.spikeCenter, 2);
        objectPoolers[5] = new ObjectPooler(obstacles.blocks, 3);
    }

    private int GetspikeId(SpecialQueue queue) {
        int x = Random.Range(1, maxObstacleId);
        while (queue.IsAlert(x)) {
            x = Random.Range(1, maxObstacleId);
        }
        queue.Push(x);

        return x;
    }

    private GameObject Spawn(GameObject obj) {
        Transform transForm = obj.transform;
        transForm.position = new Vector2(transForm.position.x, 12f);
        transForm.rotation = Quaternion.identity;

        //reset Y position of its each children
        for (int i = 0; i < transForm.childCount; i++) {
            Transform childTransform = transForm.GetChild(i);
            childTransform.localPosition = new Vector2(childTransform.localPosition.x, 0f);
        }
        transForm.parent = transform;
        obj.SetActive(true);

        return obj;
    }

    // Data Struct for holding previous generated values and provide useful to generate next spike.
    private class SpecialQueue {

        private readonly int[] array;

        public SpecialQueue() {
            array = new int[2];
            array[0] = array[1] = -1;
        }

        public void Push(int num) {
            array[1] = array[0];
            array[0] = num;
        }

        // returns true is any spike (i.e 1,2,3) is going to be instatiated 3 times or 4th one 2 times in a row.
        public bool IsAlert(int num) {
            if (array[0] == 4 && num == 4) {
                return true;
            }
            return (array[0] == array[1] && array[0] == num);
        }

        // returns true if next spike coming is 4th one after 1st or 2nd one.
        public bool IsCenterSpike() {
            return (array[0] == 4 && array[1] < 3);
        }
    }
}
